import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminCommunicationService } from '@app/services/communication/admin/admin.communication.service';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.scss',
})
export class LoginPageComponent implements OnInit {
    errorMessage = '';
    isLoading = false;
    form!: FormGroup;
    currentYear = new Date().getFullYear();

    constructor(
        private fb: FormBuilder,
        private adminCommService: AdminCommunicationService,
        private router: Router,
        private cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        this.adminCommService.postLoginAdmin(this.form.value as { email: string; password: string })
            .subscribe({
                next: (res) => {
                    this.isLoading = false;
                    if (res.success && res.token) {
                        sessionStorage.setItem('adminToken', res.token);
                        this.router.navigate(['/admin/dashboard']);
                    } else {
                        this.errorMessage = res.message || 'Erreur inconnue.';
                    }
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isLoading = false;
                    this.errorMessage = 'Erreur lors de la connexion.';
                    this.cdr.detectChanges();
                },
            });
    }
}
