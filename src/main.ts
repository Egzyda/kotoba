import './styles.css';
import { cleanupReloadParam } from './lib/update';
import { defineRoute, startRouter } from './router';
import { cardsScreen } from './screens/cards';
import { homeScreen } from './screens/home';
import { selectScreen } from './screens/select';
import { traceScreen } from './screens/trace';

cleanupReloadParam();

defineRoute('/', homeScreen);
defineRoute('/select', selectScreen);
defineRoute('/trace', traceScreen);
defineRoute('/cards', cardsScreen);

startRouter(document.getElementById('app')!);
