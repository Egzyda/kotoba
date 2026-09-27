import './styles.css';
import { cleanupReloadParam } from './lib/update';
import { defineRoute, startRouter } from './router';
import { loadCharacterId } from './lib/storage';
import { cardsScreen } from './screens/cards';
import { charaScreen } from './screens/chara';
import { homeScreen } from './screens/home';
import { selectScreen } from './screens/select';
import { traceScreen } from './screens/trace';

cleanupReloadParam();

defineRoute('/', homeScreen);
defineRoute('/select', selectScreen);
defineRoute('/trace', traceScreen);
defineRoute('/cards', cardsScreen);
defineRoute('/chara', charaScreen);

// はじめて開いたときは、あんないキャラを えらんでもらう
if (loadCharacterId() === null) window.location.replace('#/chara');

startRouter(document.getElementById('app')!);
