const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
function loader(mocks = {}, math = Math) {
  const cache = new Map();
  function load(file) {
    const full = path.resolve(root, file);
    if (cache.has(full)) return cache.get(full).exports;
    const module = { exports: {} }; cache.set(full, module);
    const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, Math: math, require(id) {
      if (id in mocks) return mocks[id];
      if (id.startsWith('.')) return load(path.resolve(path.dirname(full), `${id}.ts`));
      throw new Error(`Unexpected dependency: ${id}`);
    } }, { filename: full });
    return module.exports;
  }
  return load;
}
const load = loader();
const { createNormalGame, resolveNormalRound, normalizeNormalGame, replayNormalGame, finishNormalSession, getNormalStandings, showNormalRoundResult, continueNormalAfterDraw, restartNormalSession } = load('src/game/gameLogic.ts');
function completeVote(state, id) {
  const result = resolveNormalRound(state, id);
  return result.currentPhase === 'voteResult' ? showNormalRoundResult(result) : result;
}
const themes = load('src/game/episodeThemes.ts');
const names = ['あおい', 'なお', 'はる', 'ゆう', 'そら'];
const fresh = (overrides = {}) => createNormalGame({ playerNames: names, selectedTheme: themes.FREE_CATEGORIES[0], ...overrides });
function voting(wolfId = 0) {
  const state = fresh();
  return { ...state, currentPhase: 'voting', players: state.players.map(p => ({ ...p, role: p.id === wolfId ? '人狼' : '村人', hasSeenRole: true })) };
}
function assertFresh(state, expectedNames = names) {
  assert.equal(state.rulesVersion, 2); assert.equal(state.currentPhase, 'roleReveal');
  assert.equal(state.werewolfCount, 1); assert.equal(state.currentDay, 1);
  for (const key of ['currentTopic', 'accusedPlayerId', 'eliminatedTonight', 'winner']) assert.equal(state[key], null);
  assert.deepEqual(plain(state.votingResults), {});
  assert.deepEqual(plain(state.players.map(p => p.name)), expectedNames);
  state.players.forEach((p, id) => {
    assert.equal(p.id, id); assert.equal(p.role, null); assert.equal(p.isAlive, true);
    assert.equal(p.hasSeenRole, false); assert.equal(p.votes, 0);
  });
}
let count = 0;
async function test(name, fn) { await fn(); count++; console.log(`PASS ${name}`); }
async function main() {
  await test('3〜20人で開始でき、範囲外は拒否する', () => {
    for (let size = 3; size <= 20; size++) {
      const playerNames = Array.from({ length: size }, (_, i) => `参加者${i}`);
      assertFresh(fresh({ playerNames }), playerNames);
    }
    for (const size of [0, 2, 21]) assert.throws(() => fresh({ playerNames: Array(size).fill('名前') }));
  });
  await test('3〜20人の全位置に唯一の人狼を配役できる', () => {
    let draws = []; const math = Object.create(Math);
    math.random = () => { assert.ok(draws.length); return draws.shift(); };
    const { assignRoles } = loader({}, math)('src/game/gameLogic.ts');
    for (let size = 3; size <= 20; size++) for (let wolfId = 0; wolfId < size; wolfId++) {
      draws = Array.from({ length: size - 1 }, (_, i) => size - 1 - i === wolfId ? 0 : 0.9999999999999999);
      const roles = assignRoles(size, 1);
      assert.equal(roles.length, size); assert.equal(roles.filter(r => r === '人狼').length, 1);
      assert.equal(roles[wolfId], '人狼'); assert.equal(draws.length, 0);
    }
  });
  await test('正解・不正解は1投票で決着し、脱落させない', () => {
    for (const [wolfId, accused, winner] of [[0, 0, '村人'], [4, 4, '村人'], [0, 1, '人狼']]) {
      const state = voting(wolfId), before = plain(state), result = completeVote(state, accused);
      assert.equal(result.currentPhase, 'gameOver'); assert.equal(result.winner, winner);
      assert.equal(result.accusedPlayerId, accused); assert.ok(result.players.every(p => p.isAlive));
      assert.equal(result.currentDay, 1); assert.deepEqual(plain(state), before);
      assert.equal(normalizeNormalGame(result), result);
    }
  });
  await test('無効な投票・二度目の確定・不正配役を拒否する', () => {
    for (const id of [-1, 5, 0.5, NaN, '0', undefined]) assert.throws(() => completeVote(voting(), id));
    assert.throws(() => completeVote(fresh(), 0));
    assert.throws(() => completeVote(completeVote(voting(), 0), 0));
    for (const roles of [[null, null, null, null, null], ['村人','村人','村人','村人','村人'], ['人狼','人狼','村人','村人','村人']]) {
      const state = voting(); state.players = state.players.map((p, i) => ({ ...p, role: roles[i] }));
      assert.throws(() => completeVote(state, 0));
    }
  });
  await test('旧ルールの全フェーズで、脱落者も含め全員で再配役する', () => {
    for (const currentPhase of ['roleReveal','episodeAnnouncement','episodeTime','discussion','voting','voteResult','night','gameOver']) {
      const old = { ...voting(), currentPhase, currentDay: 3, werewolfCount: 2, selectedTheme: themes.CUSTOM_THEME, customTopic: '休日に一人でしたこと', eliminatedTonight: 1 };
      delete old.rulesVersion; delete old.accusedPlayerId;
      old.players[1] = { ...old.players[1], role: '人狼', isAlive: false, votes: 2 };
      const before = plain(old), migrated = normalizeNormalGame(old);
      assertFresh(migrated); assert.equal(migrated.selectedTheme, themes.CUSTOM_THEME);
      assert.equal(migrated.customTopic, old.customTopic); assert.deepEqual(plain(old), before);
    }
  });
  await test('新ルールの途中再開は役・確認済み情報・お題を保持する', () => {
    const initial = fresh(); assert.equal(normalizeNormalGame(initial), initial);
    for (const currentPhase of ['roleReveal','episodeAnnouncement','episodeTime','discussion','voting']) {
      const state = voting(3); state.currentPhase = currentPhase;
      state.currentTopic = { category: themes.FREE_CATEGORIES[0], topic: '表示済みのお題' };
      if (currentPhase === 'roleReveal') state.players = state.players.map(p => ({ ...p, hasSeenRole: p.id < 2 }));
      assert.equal(normalizeNormalGame(state), state);
    }
    for (const mutate of [s => { s.currentPhase = 'night'; }, s => { s.players[1].id = 0; }, s => { s.players[1].isAlive = false; }, s => { s.players[1].role = '人狼'; }]) {
      const state = voting(); mutate(state); assertFresh(normalizeNormalGame(state));
    }
    for (const value of [null, {}, 'state', { ...fresh(), players: [] }, { ...fresh(), players: [null,null,null] }, { ...fresh(), selectedTheme: null }]) assert.equal(normalizeNormalGame(value), null);
  });
  await test('再戦は全員復帰し、自作・トピック・ランダムの選択を引き継ぐ', () => {
    for (const selectedTheme of [themes.CUSTOM_THEME, themes.FREE_CATEGORIES[0], themes.SHUFFLE_THEME]) {
      const finished = completeVote({ ...voting(4), selectedTheme, customTopic: selectedTheme === themes.CUSTOM_THEME ? '自作のお題' : undefined }, 4);
      const next = createNormalGame({ playerNames: finished.players.map(p => p.name), selectedTheme: finished.selectedTheme, customTopic: finished.customTopic });
      assertFresh(next); assert.equal(next.selectedTheme, selectedTheme); assert.equal(next.customTopic, finished.customTopic);
      const topic = themes.getTopicForTheme(next.selectedTheme, themes.FREE_CATEGORIES, next.customTopic);
      if (selectedTheme === themes.CUSTOM_THEME) assert.equal(topic.topic, '自作のお題');
      else assert.ok(themes.FREE_CATEGORIES.includes(topic.category));
    }
  });
  await test('storageは移行を一度だけ保存し、他モードの保存は変更しない', async () => {
    const old = voting(); delete old.rulesVersion;
    const data = new Map([['gameState', JSON.stringify(old)], ['cardState','unchanged'], ['normalSetup','unchanged']]), writes = [];
    const storage = loader({ '@react-native-async-storage/async-storage': { __esModule: true, default: {
      getItem: async key => data.get(key) ?? null,
      setItem: async (key, value) => { writes.push(key); data.set(key, value); },
    } } })('src/game/storage.ts');
    const migrated = await storage.loadGameState(); assertFresh(migrated); assert.deepEqual(writes, ['gameState']);
    assert.deepEqual(plain(await storage.loadGameState()), plain(migrated)); assert.deepEqual(writes, ['gameState']);
    assert.equal(data.get('cardState'), 'unchanged'); assert.equal(data.get('normalSetup'), 'unchanged');
    for (const raw of ['{broken', 'null', '{"players":[]}']) { data.set('gameState', raw); assert.equal(await storage.loadGameState(), null); }
    assert.deepEqual(writes, ['gameState']);
  });
  await test('敗者だけに1杯を加算する', () => {
    for (const [accused, expected] of [[0, [1,0,0,0,0]], [1, [0,1,1,1,1]]]) {
      const before = voting(), result = completeVote(before, accused);
      assert.equal(result.session.completedRounds, 1);
      assert.deepEqual(plain(result.session.lossPoints), expected);
      assert.deepEqual(plain(before.session.lossPoints), [0,0,0,0,0]);
      const restored = normalizeNormalGame(plain(result));
      assert.deepEqual(plain(restored.session), plain(result.session));
      assert.deepEqual(plain(normalizeNormalGame(restored).session), plain(result.session));
    }
  });
  await test('役が変わっても同じメンバーの累計を引き継ぎ、再戦時に加点しない', () => {
    const first = completeVote({ ...voting(), selectedTheme: themes.CUSTOM_THEME, customTopic: '自作のお題' }, 0);
    const next = replayNormalGame(first);
    assertFresh(next);
    assert.deepEqual(plain(next.session), { completedRounds: 1, lossPoints: [1,0,0,0,0] });
    assert.equal(next.customTopic, '自作のお題');
    assert.notEqual(next.session.lossPoints, first.session.lossPoints);
    const second = completeVote({ ...next, currentPhase: 'voting', players: next.players.map(p => ({ ...p, role: p.id === 1 ? '人狼' : '村人', hasSeenRole: true })) }, 0);
    assert.deepEqual(plain(second.session), { completedRounds: 2, lossPoints: [2,0,1,1,1] });
    assert.deepEqual(plain(first.session.lossPoints), [1,0,0,0,0]);
    assert.throws(() => replayNormalGame(voting()));
  });
  await test('集計は確定済みゲームだけで、途中終了・再表示で加点しない', () => {
    const first = completeVote(voting(), 0);
    const unfinished = replayNormalGame(first);
    const ended = finishNormalSession(unfinished);
    assert.equal(ended.currentPhase, 'sessionSummary');
    assert.equal(normalizeNormalGame(ended), ended);
    assert.deepEqual(plain(ended.session), plain(first.session));
    assert.deepEqual(plain(finishNormalSession(ended).session), plain(first.session));
    assert.deepEqual(plain(replayNormalGame(ended).session), plain(first.session));
    const zero = finishNormalSession(fresh());
    assert.equal(normalizeNormalGame(zero), zero);
    assert.deepEqual(plain(zero.session), { completedRounds: 0, lossPoints: [0,0,0,0,0] });
  });
  await test('同名の参加者も別集計し、少ない順・同率順位で表示する', () => {
    const state = fresh({ playerNames: ['同じ名前','同じ名前','C','D','E'] });
    state.session = { completedRounds: 3, lossPoints: [2,0,1,0,3] };
    const rows = plain(getNormalStandings(state));
    assert.deepEqual(rows.map(r => r.id), [1,3,2,0,4]);
    assert.deepEqual(rows.map(r => r.rank), [1,1,3,4,5]);
    assert.deepEqual(rows.map(r => r.tied), [true,true,false,false,false]);
    assert.equal(rows[0].name, rows[3].name);
    assert.notEqual(rows[0].points, rows[3].points);
  });
  await test('ポイント導入前の保存は直近の確定結果だけを一度集計する', () => {
    const legacy = completeVote(voting(), 0); delete legacy.session;
    const migrated = normalizeNormalGame(legacy);
    assert.deepEqual(plain(migrated.session), { completedRounds: 1, lossPoints: [1,0,0,0,0] });
    assert.equal(normalizeNormalGame(migrated), migrated);
    const ongoing = voting(); delete ongoing.session;
    assert.deepEqual(plain(normalizeNormalGame(ongoing).session), { completedRounds: 0, lossPoints: [0,0,0,0,0] });
    for (const session of [null, {}, { completedRounds: -1, lossPoints: [0,0,0,0,0] }, { completedRounds: 2, lossPoints: [3,0,0,0,0] }, { completedRounds: 2, lossPoints: [0,0] }]) {
      assert.deepEqual(plain(normalizeNormalGame({ ...ongoing, session }).session), { completedRounds: 0, lossPoints: [0,0,0,0,0] });
    }
  });
  await test('保存失敗の再試行で二重加点せず、新メンバーでは0杯に戻る', async () => {
    const original = voting(); const data = new Map([['gameState', JSON.stringify(original)]]); let fail = true;
    const storage = loader({ '@react-native-async-storage/async-storage': { __esModule: true, default: {
      getItem: async key => data.get(key) ?? null,
      setItem: async (key,value) => { if (fail) { fail = false; throw new Error('write failed'); } data.set(key,value); },
      removeItem: async key => data.delete(key),
    } } })('src/game/storage.ts');
    await assert.rejects(storage.saveGameState(completeVote(original, 0)));
    const reloaded = await storage.loadGameState();
    assert.deepEqual(plain(reloaded.session), plain(original.session));
    await storage.saveGameState(completeVote(reloaded, 0));
    assert.deepEqual(plain((await storage.loadGameState()).session), { completedRounds: 1, lossPoints: [1,0,0,0,0] });
    await storage.clearGameState(); assert.equal(await storage.loadGameState(), null);
    const newMembers = fresh({ playerNames: ['A','B','C'] });
    assert.deepEqual(plain(newMembers.session), { completedRounds: 0, lossPoints: [0,0,0] });
  });
  await test('正体発表と勝敗発表は同じ確定結果で、再表示や次へで二重加点しない', () => {
    for (const id of [0, 1]) {
      const reveal = resolveNormalRound(voting(), id);
      assert.equal(reveal.currentPhase, 'voteResult');
      assert.equal(normalizeNormalGame(reveal), reveal);
      assert.equal(reveal.session.completedRounds, 1);
      assert.throws(() => resolveNormalRound(reveal, id));
      assert.throws(() => replayNormalGame(reveal));
      const final = showNormalRoundResult(normalizeNormalGame(plain(reveal)));
      assert.equal(final.currentPhase, 'gameOver');
      assert.deepEqual(plain(final.session), plain(reveal.session));
      assert.throws(() => showNormalRoundResult(final));
      assert.deepEqual(plain(finishNormalSession(reveal).session), plain(reveal.session));
    }
  });
  await test('追放なしは朝の演出から同じ配役で次のお題へ進み、繰り返しても加点しない', () => {
    const original = voting(3);
    original.session = { completedRounds: 2, lossPoints: [1,2,1,0,1] };
    original.currentTopic = { category: themes.FREE_CATEGORIES[0], topic: '前のお題' };
    let state = original;
    for (let i = 0; i < 3; i++) {
      const morning = resolveNormalRound(state, null);
      assert.equal(morning.currentPhase, 'peacefulMorning'); assert.equal(morning.winner, null);
      assert.equal(normalizeNormalGame(morning), morning);
      assert.deepEqual(plain(morning.session), plain(original.session));
      assert.throws(() => showNormalRoundResult(morning));
      const next = continueNormalAfterDraw(normalizeNormalGame(plain(morning)));
      assert.equal(next.currentPhase, 'episodeAnnouncement'); assert.equal(next.currentTopic, null);
      assert.deepEqual(plain(next.players), plain(original.players));
      assert.deepEqual(plain(next.session), plain(original.session));
      assert.equal(normalizeNormalGame(next), next);
      state = { ...next, currentPhase: 'voting' };
    }
    const final = completeVote(state, 3);
    assert.deepEqual(plain(final.session), { completedRounds: 3, lossPoints: [1,2,1,1,1] });
    assert.throws(() => continueNormalAfterDraw(voting()));
  });
  await test('同じメンバーで0杯からは保存データも新しくし、再読込・次の勝敗でも旧累計が戻らない', async () => {
    const finished = finishNormalSession(completeVote(voting(), 0));
    finished.session = { completedRounds: 7, lossPoints: [4,3,2,1,0] };
    const data = new Map([['gameState', JSON.stringify(finished)], ['cardState', 'unchanged']]);
    let fail = true;
    const storage = loader({ '@react-native-async-storage/async-storage': { __esModule: true, default: {
      getItem: async key => data.get(key) ?? null,
      setItem: async (key,value) => { if (fail) { fail = false; throw new Error('write failed'); } data.set(key,value); },
    } } })('src/game/storage.ts');
    await assert.rejects(storage.restartSavedNormalSession());
    assert.deepEqual(plain((await storage.loadGameState()).session), plain(finished.session));
    const next = await storage.restartSavedNormalSession();
    assertFresh(next);
    assert.deepEqual(plain(next.session), { completedRounds: 0, lossPoints: [0,0,0,0,0] });
    assert.deepEqual(plain(await storage.loadGameState()), plain(next));
    await assert.rejects(storage.restartSavedNormalSession());
    const voted = completeVote({ ...next, currentPhase: 'voting', players: voting().players }, 0);
    await storage.saveGameState(voted);
    assert.deepEqual(plain((await storage.loadGameState()).session), { completedRounds: 1, lossPoints: [1,0,0,0,0] });
    assert.equal(data.get('cardState'), 'unchanged');
    assert.throws(() => restartNormalSession(voting()));
  });
  await test('設定の初期テーマは解放済みから選び、乱数の全区間でロック済みを除く', () => {
    const math = Object.create(Math); let sample = 0; math.random = () => sample;
    const library = loader({}, math)('src/game/episodeThemes.ts');
    for (const available of [[], themes.FREE_CATEGORIES, [...themes.FREE_CATEGORIES, '食べ物の話']]) {
      const reached = new Set();
      for (let i = 0; i < 1000; i++) { sample = i / 1000; const topic = library.getRandomTopic(available); reached.add(topic.category); }
      assert.deepEqual([...reached].sort(), [...new Set([...themes.FREE_CATEGORIES, ...available])].sort());
    }
  });
  console.log(`${count} normal-game tests passed.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
