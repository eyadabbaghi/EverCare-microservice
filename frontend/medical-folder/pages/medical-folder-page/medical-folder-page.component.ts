

import { Component } from '@angular/core';
import { MedicalDocument, Medication, VitalSign } from '../../interfaces/medical-folder';

@Component({
  selector: 'app-medical-folder-page',
  templateUrl: './medical-folder-page.component.html',
  styleUrls: ['./medical-folder-page.component.css']
})
export class MedicalFolderPageComponent {
  searchQuery: string = '';
  activeTab: 'documents' | 'medications' | 'vitals' = 'documents';

  // Données mockées
  documents: MedicalDocument[] = [
    {
      id: '1',
      name: 'Blood Test Results - Complete Panel',
      type: 'lab-result',
      date: '2026-01-28',
      size: '245 KB',
      doctor: 'Dr. Sarah Wilson'
    },
    {
      id: '2',
      name: 'MRI Brain Scan Report',
      type: 'scan',
      date: '2026-01-15',
      size: '8.2 MB',
      doctor: 'Dr. Michael Chen'
    },
    {
      id: '3',
      name: 'Prescription - Medication Update',
      type: 'prescription',
      date: '2026-01-28',
      size: '128 KB',
      doctor: 'Dr. Sarah Wilson'
    },
    {
      id: '4',
      name: 'Annual Physical Examination',
      type: 'report',
      date: '2026-01-10',
      size: '512 KB',
      doctor: 'Dr. Sarah Wilson'
    },
    {
      id: '5',
      name: 'Cognitive Assessment Results',
      type: 'report',
      date: '2025-12-20',
      size: '384 KB',
      doctor: 'Dr. Michael Chen'
    }
  ];

  medications: Medication[] = [
    {
      id: '1',
      name: 'Donepezil',
      dosage: '10mg',
      frequency: 'Once daily (morning)',
      startDate: '2025-06-15',
      prescribedBy: 'Dr. Michael Chen',
      active: true
    },
    {
      id: '2',
      name: 'Memantine',
      dosage: '20mg',
      frequency: 'Twice daily',
      startDate: '2025-08-01',
      prescribedBy: 'Dr. Michael Chen',
      active: true
    },
    {
      id: '3',
      name: 'Vitamin D3',
      dosage: '2000 IU',
      frequency: 'Once daily',
      startDate: '2025-05-01',
      prescribedBy: 'Dr. Sarah Wilson',
      active: true
    },
    {
      id: '4',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily (morning)',
      startDate: '2024-03-10',
      endDate: '2025-11-30',
      prescribedBy: 'Dr. Sarah Wilson',
      active: false
    }
  ];

  vitalSigns: VitalSign[] = [
    { id: '1', type: 'blood-pressure', value: '120/80 mmHg', date: '2026-02-01', time: '09:00' },
    { id: '2', type: 'heart-rate', value: '72 bpm', date: '2026-02-01', time: '09:00' },
    { id: '3', type: 'temperature', value: '98.6°F', date: '2026-02-01', time: '09:00' },
    { id: '4', type: 'weight', value: '165 lbs', date: '2026-02-01', time: '09:00' },
    { id: '5', type: 'blood-pressure', value: '118/78 mmHg', date: '2026-01-25', time: '10:30' },
    { id: '6', type: 'heart-rate', value: '68 bpm', date: '2026-01-25', time: '10:30' },
  ];

  // Getters pour les données filtrées
  get filteredDocuments(): MedicalDocument[] {
    if (!this.searchQuery) return this.documents;
    const query = this.searchQuery.toLowerCase();
    return this.documents.filter(doc =>
      doc.name.toLowerCase().includes(query) ||
      doc.doctor?.toLowerCase().includes(query)
    );
  }

  get activeMedications(): Medication[] {
    return this.medications.filter(med => med.active);
  }

  get inactiveMedications(): Medication[] {
    return this.medications.filter(med => !med.active);
  }

  // Méthodes utilitaires
  getDocumentIcon(type: string): string {
    const icons: Record<string, string> = {
      'lab-result': '🧪',
      'prescription': '💊',
      'report': '📋',
      'scan': '🔬',
      'other': '📄'
    };
    return icons[type] || '📄';
  }

  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'lab-result': 'Lab Result',
      'prescription': 'Prescription',
      'report': 'Medical Report',
      'scan': 'Scan/Imaging',
      'other': 'Document'
    };
    return labels[type] || 'Document';
  }

  getVitalIcon(type: string): string {
    const icons: Record<string, string> = {
      'blood-pressure': '💓',
      'heart-rate': '❤️',
      'temperature': '🌡️',
      'weight': '⚖️'
    };
    return icons[type] || '📊';
  }

  getVitalLabel(type: string): string {
    const labels: Record<string, string> = {
      'blood-pressure': 'Blood Pressure',
      'heart-rate': 'Heart Rate',
      'temperature': 'Temperature',
      'weight': 'Weight'
    };
    return labels[type] || 'Vital Sign';
  }

  // Gestionnaires d'événements
  onTabChange(tab: 'documents' | 'medications' | 'vitals'): void {
    this.activeTab = tab;
  }

  onUploadClick(): void {
    console.log('Upload document clicked');
    // Implémenter la logique d'upload
  }

  onDownloadDocument(doc: MedicalDocument): void {
    console.log('Downloading:', doc.name);
    // Implémenter la logique de téléchargement
  }
}
