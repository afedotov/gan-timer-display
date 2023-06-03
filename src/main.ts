
import { bootstrapApplication } from '@angular/platform-browser';
import { TimerDisplay } from './display.component'

bootstrapApplication(TimerDisplay).catch(err => console.error(err));

// Screen WakeLock
if (typeof navigator.wakeLock?.request === 'function') {
    navigator.wakeLock.request('screen');
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && navigator.wakeLock.request('screen'));
}
