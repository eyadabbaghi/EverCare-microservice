import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrontOfficeRoutingModule } from './front-office-routing.module';

import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ActivitiesComponent } from './pages/activities/activities.component';
import { ActivityDetailsComponent } from './pages/activity-details/activity-details.component';
import { AlertsComponent } from './pages/alerts/alerts.component';
import { ProfileComponent } from './pages/profile/profile.component';

// your UI components...
import { NavigationComponent } from './ui/navigation/navigation.component';
import { AiAssistantComponent } from './ui/ai-assistant/ai-assistant.component';
import { WelcomePopupComponent } from './ui/welcome-popup/welcome-popup.component';
import { AlzheimersAssessmentComponent } from './ui/alzheimers-assessment/alzheimers-assessment.component';

import { SharedModule } from '../../shared/shared.module';
import { LucideAngularModule } from 'lucide-angular';
import { NewUserFlowComponent } from './pages/login/new-user-flow.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { SetupProfileComponent } from './pages/setup-profile/setup-profile.component';

// 👇 ADD THIS IMPORT
import { DoctorSearchModalComponent } from './pages/profile/doctor-search-modal.component';


import { DailyMeModule } from '../daily-me/daily-me.module';

@NgModule({
  declarations: [
    HomeComponent,
    AboutComponent,
    ContactComponent,
    ServicesComponent,
    PricingComponent,
    FaqComponent,
    LoginComponent,
    RegisterComponent,
    FeatureCardComponent,
    TestimonialComponent,
    TeamMemberComponent,
    ContactFormComponent,
    NewsletterComponent,
    ActivitiesComponent,
    ActivityDetailsComponent,
    AlertsComponent,


    NavigationComponent,
    AiAssistantComponent,
    WelcomePopupComponent,
    AlzheimersAssessmentComponent,
    NewUserFlowComponent,
    SetupProfileComponent,
    // 👇 ADD THIS COMPONENT
    DoctorSearchModalComponent,
  ],

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    FrontOfficeRoutingModule,
    LucideAngularModule,




    DailyMeModule,
  ],
  exports: [
    NavigationComponent,
    AiAssistantComponent,
  ],
})
export class FrontOfficeModule {}
