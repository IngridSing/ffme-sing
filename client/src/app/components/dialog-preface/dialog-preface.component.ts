import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-dialog-preface',
    standalone: true,
    imports: [MatDialogModule],
    templateUrl: './dialog-preface.component.html',
    styleUrls: ['./dialog-preface.component.scss'],
})
export class DialogPrefaceComponent {
    pdfUrlSafe: SafeResourceUrl;

    constructor(
        public dialogRef: MatDialogRef<DialogPrefaceComponent>,
        private sanitizer: DomSanitizer,
    ) {
        const pdfUrl = 'assets/preface.pdf#toolbar=0&navpanes=0&scrollbar=0';
        this.pdfUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
    }
}
