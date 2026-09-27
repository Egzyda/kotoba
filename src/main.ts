import './styles.css';
import { play, unlockAudio } from './lib/sfx';
import { stopSpeech, unlockSpeech } from './lib/speech';
import { cleanupReloadParam } from './lib/update';
import { defineRoute, startRouter } from './router';
import { loadCharacterId } from './lib/storage';
import { cardsScreen } from './screens/cards';
import { charaScreen } from './screens/chara';
import { homeScreen } from './screens/home';
import { orderScreen } from './screens/order';
import { selectScreen } from './screens/select';
import { traceScreen } from './screens/trace';
import { writeScreen } from './screens/write';

cleanupReloadParam();

// スマホは タップするまで おと・よみあげが でないので、さいしょのタップで ひらく
// （iPhone は pointerdown では ひらけないことが あるので touchend / click でも よぶ）
let unlocked = false;
const unlock = () => {
  unlockAudio();
  if (!unlocked) unlockSpeech();
  unlocked = true;
};
for (const type of ['pointerdown', 'touchend', 'click']) {
  window.addEventListener(type, unlock, { capture: true, passive: true });
}
// ボタンを おしたら「ぽこっ」（ならべるの タイルなど じぶんの おとが ある ものは data-sfx="none"）
window.addEventListener(
  'click',
  (e) => {
    const btn = (e.target as Element | null)?.closest?.('button');
    if (btn && !btn.disabled && !btn.closest('[data-sfx="none"]')) play('tap');
  },
  { capture: true },
);
// がめんが かわったら よみあげを とめる
window.addEventListener('hashchange', stopSpeech);

defineRoute('/', homeScreen);
defineRoute('/select', selectScreen);
defineRoute('/trace', traceScreen);
defineRoute('/cards', cardsScreen);
defineRoute('/chara', charaScreen);
defineRoute('/write', writeScreen);
defineRoute('/order', orderScreen);

// はじめて開いたときは、あんないキャラを えらんでもらう
if (loadCharacterId() === null) window.location.replace('#/chara');

startRouter(document.getElementById('app')!);
