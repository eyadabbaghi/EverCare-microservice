import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalFolderRoutingModule } from './medical-folder-routing.module';
import { MedicalFolderPageComponent } from './pages/medical-folder-page/medical-folder-page.component';
import {FormsModule} from "@angular/forms";
import { DocumentsTabComponent } from './components/documents-tab/documents-tab.component';
import { MedicationsTabComponent } from './components/medications-tab/medications-tab.component';
import { VitalsTabComponent } from './components/vitals-tab/vitals-tab.component';
import { MedicalRecordListComponent } from './pages/medical-record-list/medical-record-list.component';
import { MedicalRecordDetailsComponent } from './pages/medical-record-details/medical-record-details.component';
import { MedicalRecordFormComponent } from './pages/medical-record-form/medical-record-form.component';
import { DoctorReportsListComponent } from './pages/doctor-reports-list/doctor-reports-list.component';


@NgModule({
  declarations: [
    MedicalFolderPageComponent,
    DocumentsTabComponent,
    MedicationsTabComponent,
    VitalsTabComponent,
    MedicalRecordListComponent,
    MedicalRecordDetailsComponent,
    MedicalRecordFormComponent,
    DoctorReportsListComponent,
  ],
    imports: [
        MedicalFolderRoutingModule,
        FormsModule,
      CommonModule,
    ]
})
export class MedicalFolderModule { }
