import './styles.css';
import { unlockSfx } from './lib/sfx';
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
let unlocked = false;
window.addEventListener(
  'pointerdown',
  () => {
    unlockSfx();
    if (!unlocked) unlockSpeech();
    unlocked = true;
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
