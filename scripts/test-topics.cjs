const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
// Transpile the production modules in memory; mock only external store APIs.
function loader(mocks = {}, env = {}, math = Math) {
  const cache = new Map();
  function load(file) {
    const full = path.resolve(root, file);
    if (cache.has(full)) return cache.get(full).exports;
    const module = { exports: {} };
    cache.set(full, module);
    const code = ts.transpileModule(fs.readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const requireModule = (id) => {
      if (id in mocks) return mocks[id];
      if (id.startsWith(".")) return load(path.resolve(path.dirname(full), id + ".ts"));
      throw new Error(`Unexpected dependency ${id}`);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: requireModule, process: { env }, console, Intl, Math: math }, { filename: full });
    return module.exports;
  }
  return load;
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const load = loader();
const themes = load("src/game/episodeThemes.ts");
const catalog = load("src/game/topicCatalog.ts");
const { topics, topicProducts, packs, singleProducts, allTopicsProduct, categoriesForEntitlements, missingTopics, remainingPurchaseCost } = catalog;
let count = 0;
async function test(name, fn) { await fn(); count++; console.log(`PASS ${name}`); }

async function main() {
  await test("3 fixed free topics, 12 paid topics, 7 prompts each", () => {
    assert.deepEqual(plain(themes.FREE_CATEGORIES), ["恥ずかしい失敗談", "初めての経験", "本音トーク"]);
    assert.equal(topics.filter((topic) => topic.free).length, 3);
    assert.equal(singleProducts.length, 12);
    assert.equal(new Set(topicProducts.map((product) => product.id)).size, 17);
    for (const topic of topics) { assert.equal(topic.topics.length, 7); assert.ok(topic.topics.includes(topic.preview)); }
  });
  await test("packs partition the paid library; bulk prices are lower", () => {
    assert.equal(packs.length, 4);
    assert.deepEqual(plain(packs.flatMap((pack) => pack.topicIds).sort()), plain(allTopicsProduct.topicIds.slice().sort()));
    for (const pack of packs) { assert.equal(pack.topicIds.length, 3); assert.ok(pack.price < 3 * 120); }
    assert.ok(allTopicsProduct.price < packs.reduce((sum, pack) => sum + pack.price, 0));
  });
  await test("unowned, unknown, and stale selections cannot draw paid prompts", () => {
    for (const theme of [themes.SHUFFLE_THEME, ...topics.map((topic) => topic.category), "deleted-category"]) {
      for (let draw = 0; draw < 100; draw++) assert.ok(themes.FREE_CATEGORIES.includes(themes.getTopicForTheme(theme).category));
    }
  });
  await test("single, pack, complete, and revoked entitlements determine the library", () => {
    for (const product of topicProducts) {
      const ids = product.topicIds.map((id) => `topic_${id}`);
      const available = categoriesForEntitlements(ids);
      assert.equal(available.length, 3 + product.topicIds.length);
      assert.equal(missingTopics(product, available).length, 0);
      for (const id of product.topicIds) {
        const topic = topics.find((item) => item.id === id);
        assert.equal(themes.getTopicForTheme(topic.category, available).category, topic.category);
      }
      for (let draw = 0; draw < 100; draw++) assert.ok(available.includes(themes.getRandomTopic(available).category));
    }
    assert.equal(categoriesForEntitlements(["unknown", "all_topics_v1"]).length, 3);
    assert.equal(categoriesForEntitlements([]).length, 3); // refunded entitlements aren't retained
  });
  await test("shuffle reaches every available prompt and never a locked one at every random interval", () => {
    let randomValues = [];
    const controlledMath = Object.create(Math);
    controlledMath.random = () => {
      assert.ok(randomValues.length > 0, "unexpected random draw");
      return randomValues.shift();
    };
    const controlled = loader({}, {}, controlledMath)("src/game/episodeThemes.ts");
    const libraries = [[], ["topic_romance"], packs[0].topicIds.map((id) => `topic_${id}`), allTopicsProduct.topicIds.map((id) => `topic_${id}`)];
    for (const ids of libraries) {
      const available = categoriesForEntitlements(ids);
      const allowed = topics.filter((topic) => available.includes(topic.category));
      for (let categoryIndex = 0; categoryIndex < allowed.length; categoryIndex++) {
        const topic = allowed[categoryIndex];
        for (let promptIndex = 0; promptIndex < topic.topics.length; promptIndex++) {
          randomValues = [(categoryIndex + 0.5) / allowed.length, (promptIndex + 0.5) / topic.topics.length];
          const result = controlled.getTopicForTheme(controlled.SHUFFLE_THEME, available);
          assert.deepEqual(plain(result), { category: topic.category, topic: topic.topics[promptIndex] });
        }
      }
      for (const boundary of [0, 0.9999999999999999]) {
        randomValues = [boundary, boundary];
        assert.ok(available.includes(controlled.getRandomTopic(available).category));
      }
    }
  });
  await test("custom prompts are normalized, capped, and usable across repeated draws", () => {
    assert.equal(themes.normalizeCustomTopic(" \n 私の  秘密 \n"), "私の 秘密");
    assert.equal(themes.normalizeCustomTopic("あ".repeat(50)).length, 40);
    assert.equal(themes.normalizeCustomTopic(" \n "), "");
    const custom = themes.getTopicForTheme(themes.CUSTOM_THEME, [], " 私だけの話 ");
    assert.deepEqual(plain(custom), { category: themes.CUSTOM_THEME, topic: "私だけの話" });
    assert.ok(themes.FREE_CATEGORIES.includes(themes.getTopicForTheme(themes.CUSTOM_THEME, [], " ").category));
  });
  await test("partial ownership routes to the cheapest remaining singles/packs", () => {
    const pack = packs[0];
    assert.equal(remainingPurchaseCost(pack, themes.FREE_CATEGORIES), 360);
    const one = categoriesForEntitlements([`topic_${pack.topicIds[0]}`]);
    assert.equal(remainingPurchaseCost(pack, one), 240);
    assert.equal(remainingPurchaseCost(allTopicsProduct, themes.FREE_CATEGORIES), 1200);
    const ownedPack = categoriesForEntitlements(pack.topicIds.map((id) => `topic_${id}`));
    assert.equal(remainingPurchaseCost(allTopicsProduct, ownedPack), 900);
    assert.equal(remainingPurchaseCost(allTopicsProduct, categoriesForEntitlements(allTopicsProduct.topicIds.map((id) => `topic_${id}`))), 0);
  });
  await test("new customers can buy every bundle; only cheaper alternatives redirect", () => {
    for (const product of topicProducts) assert.equal(catalog.shouldBuySeparately(product, themes.FREE_CATEGORIES), false);
    const one = categoriesForEntitlements(["topic_relationships"]);
    assert.equal(catalog.shouldBuySeparately(packs[0], one), true);
    const onePack = categoriesForEntitlements(packs[0].topicIds.map((id) => `topic_${id}`));
    assert.equal(catalog.shouldBuySeparately(allTopicsProduct, onePack), true);
    assert.equal(catalog.shouldBuySeparately(packs[0], onePack), false);
  });
  await test("live prices and currencies drive comparisons without invented discounts", () => {
    const prices = topicProducts.map((product) => ({ id: product.id, amount: product.kind === "single" ? 150 : product.kind === "pack" ? 360 : 1200, currency: "JPY", formatted: "store price" }));
    assert.equal(catalog.productPriceLabel(singleProducts[0], prices), "store price");
    assert.equal(remainingPurchaseCost(packs[0], themes.FREE_CATEGORIES, prices), 450);
    assert.match(catalog.productSavingsLabel(packs[0], prices), /90/);
    assert.equal(catalog.productSavingsLabel(packs[0], prices.filter((price) => price.id !== "topic_romance")), "関連するトピックをまとめて追加");
  });

  let purchased = 0;
  let configured = false;
  let cancelled = false;
  let failed = false;
  let productsFail = false;
  let info = { entitlements: { active: {} } };
  let listener;
  const sdk = {
    isConfigured: async () => configured,
    configure: () => { configured = true; },
    addCustomerInfoUpdateListener: (callback) => { listener = callback; },
    removeCustomerInfoUpdateListener: () => { listener = undefined; },
    getCustomerInfo: async () => info,
    getProducts: async (ids, kind) => {
      assert.equal(kind, "NON_SUBSCRIPTION");
      if (productsFail) throw new Error("offline");
      return ids.map((id) => ({ identifier: id, priceString: "¥120", price: 120, currencyCode: "JPY" }));
    },
    purchaseStoreProduct: async (product) => {
      purchased++;
      if (cancelled) throw { userCancelled: true };
      if (failed) throw new Error("pending or network error");
      assert.ok(product.identifier.startsWith("topic_") || product.identifier.startsWith("pack_") || product.identifier === "all_topics_v1");
      return { customerInfo: info };
    },
    restorePurchases: async () => info,
  };
  const constants = { executionEnvironment: "standalone" };
  const mocks = {
    "react-native": { Platform: { OS: "ios" } },
    "expo-constants": { __esModule: true, default: constants, ExecutionEnvironment: { StoreClient: "storeClient" } },
    "react-native-purchases": { __esModule: true, default: sdk, PRODUCT_CATEGORY: { NON_SUBSCRIPTION: "NON_SUBSCRIPTION" } },
  };
  const billing = loader(mocks, { EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: "appl_mock_key" })("src/game/purchases.native.ts");
  await test("native SDK requests non-consumables and observes verified entitlements", async () => {
    info = { entitlements: { active: { topic_romance: {} } } };
    const updates = [];
    const snapshot = await billing.initializeBilling((ids) => updates.push(plain(ids)));
    assert.equal(snapshot.products.length, 17);
    assert.deepEqual(plain(snapshot.entitlements), ["topic_romance"]);
    listener({ entitlements: { active: {} } });
    assert.deepEqual(updates.at(-1), []);
    billing.stopBillingListener();
    assert.equal(listener, undefined);
  });
  await test("successful purchase returns active entitlement IDs; cancellation returns none", async () => {
    assert.deepEqual(plain(await billing.purchaseTopicProduct("topic_romance")), ["topic_romance"]);
    cancelled = true;
    assert.equal(await billing.purchaseTopicProduct("topic_romance"), null);
    cancelled = false;
    failed = true;
    await assert.rejects(billing.purchaseTopicProduct("topic_romance"));
    failed = false;
    const before = purchased;
    await assert.rejects(billing.purchaseTopicProduct("invalid_product"));
    assert.equal(purchased, before);
  });
  await test("restore returns active rights; failed product fetch still updates existing rights", async () => {
    assert.deepEqual(plain(await billing.restoreTopicPurchases()), ["topic_romance"]);
    productsFail = true;
    let restored;
    await assert.rejects(billing.initializeBilling((ids) => { restored = ids; }));
    assert.deepEqual(plain(restored), ["topic_romance"]);
    productsFail = false;
  });
  await test("missing keys, Expo Go and web cannot simulate or silently grant purchases", async () => {
    const unconfigured = loader(mocks)("src/game/purchases.native.ts");
    assert.ok(unconfigured.billingUnavailableReason());
    await assert.rejects(unconfigured.purchaseTopicProduct("topic_romance"));
    constants.executionEnvironment = "storeClient";
    assert.ok(billing.billingUnavailableReason());
    await assert.rejects(billing.purchaseTopicProduct("topic_romance"));
    const web = loader()("src/game/purchases.ts");
    await assert.rejects(web.purchaseTopicProduct("topic_romance"));
    assert.deepEqual(plain(await web.initializeBilling(() => {})), { entitlements: [], products: [] });
  });
  console.log(`\n${count} topic / billing checks passed.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
