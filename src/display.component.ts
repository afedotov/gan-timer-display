
import { Component, OnInit } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { debounceTime, fromEvent, interval, merge, tap, Subscription } from 'rxjs';

import {
    connectGanTimer,
    makeTimeFromTimestamp,
    GanTimerConnection,
    GanTimerEvent,
    GanTimerState,
    GanTimerTime
} from 'gan-web-bluetooth';

const ZERO_TIME: GanTimerTime = makeTimeFromTimestamp(0);

const now: () => number =
    typeof window.performance?.now == 'function' ?
        () => Math.floor(window.performance.now()) :
        () => Date.now();

const LCD_COLOR = 'white';
const LCD_COLOR_HANDS_ON = 'red';
const LCD_COLOR_GET_SET = 'lime';

@Component({
    standalone: true,
    selector: 'app-timer-display',
    templateUrl: './display.component.html',
    imports: [MatIconModule, MatButtonModule, MatTooltipModule]
})
export class TimerDisplay implements OnInit {

    lcdColor: string = LCD_COLOR;
    lcdTime: GanTimerTime = ZERO_TIME;

    timerConn?: GanTimerConnection;
    localTimerSub?: Subscription;

    hideControls: boolean = false;

    ngOnInit(): void {
        // hide control buttons if mouse doesn't move for 5sec
        merge(
            fromEvent(document, "touchstart"),
            fromEvent(document, "mousemove")
        ).pipe(
            tap(() => this.hideControls = false),
            debounceTime(5000)
        ).subscribe(() => this.hideControls = true);
    }

    onEnterFullscreen() {
        document.documentElement.requestFullscreen();
    }

    onExitFullscreen() {
        document.exitFullscreen();
    }

    stopLocalTimer() {
        this.localTimerSub?.unsubscribe();
        this.localTimerSub = undefined;
    }

    startLocalTimer() {
        var startTime = now();
        this.lcdTime = ZERO_TIME;
        this.localTimerSub = interval(90).subscribe(() => {
            this.lcdTime = makeTimeFromTimestamp(now() - startTime);
        });
    }

    async onConnectTimer() {

        this.timerConn = await connectGanTimer();
        this.lcdColor = LCD_COLOR;

        this.timerConn.events$.subscribe((evt: GanTimerEvent) => {
            switch (evt.state) {
                case GanTimerState.HANDS_ON:
                    this.lcdColor = LCD_COLOR_HANDS_ON;
                    break;
                case GanTimerState.HANDS_OFF:
                    this.lcdColor = LCD_COLOR;
                    break;
                case GanTimerState.GET_SET:
                    this.lcdColor = LCD_COLOR_GET_SET;
                    break;
                case GanTimerState.IDLE:
                    this.lcdColor = LCD_COLOR;
                    this.lcdTime = ZERO_TIME;
                    break;
                case GanTimerState.RUNNING:
                    this.lcdColor = LCD_COLOR;
                    this.startLocalTimer();
                    break;
                case GanTimerState.STOPPED:
                    this.stopLocalTimer();
                    this.lcdTime = evt.recordedTime!;
                    break;
                case GanTimerState.DISCONNECT:
                    this.lcdColor = LCD_COLOR;
                    this.lcdTime = ZERO_TIME;
                    this.timerConn = undefined;
                    break;
            }
        });

    }

    onDisconnectTimer() {
        this.timerConn?.disconnect();
        this.timerConn = undefined;
        this.lcdTime = ZERO_TIME;
        this.lcdColor = LCD_COLOR;
    }

}
