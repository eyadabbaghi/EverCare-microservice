import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DailyMeRoutingModule } from './daily-me-routing.module';
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts';

import { DailyMeListComponent } from './daily-me-list/daily-me-list.component';
import { DailyTaskListComponent } from './daily-task-list/daily-task-list.component';
import { JournalComponent } from '../journal/journal.component';

@NgModule({
  declarations: [
    DailyMeListComponent,
    DailyTaskListComponent,
    JournalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DailyMeRoutingModule,
    BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())]
})
export class DailyMeModule { }
