import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '@common/interfaces/product';

@Component({
    selector: 'app-form-product',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './form-product.component.html',
})
export class FormProductComponent implements OnChanges {
    @Input() editProduct: Product | null = null;
    @Output() submitted = new EventEmitter<FormData>();
    @Output() closed = new EventEmitter<void>();

    productForm: FormGroup;
    selectedFile: File | null = null;
    imageInvalid = false;

    constructor(private fb: FormBuilder) {
        this.productForm = this.fb.group({
            title: ['', Validators.required],
            type: ['', Validators.required],
            description: ['', Validators.required],
            stock: [0, [Validators.required, Validators.min(0)]],
            additionalLink: [''],
            aboutInfos: this.fb.array([this.fb.group({ info: ['', Validators.required] })]), // au moins une info
            versions: this.fb.array([this.createVersionGroup()]),
        });
    }

    get versions(): FormArray {
        return this.productForm.get('versions') as FormArray;
    }

    get aboutInfos(): FormArray {
        return this.productForm.get('aboutInfos') as FormArray;
    }

    addAboutInfo(): void {
        this.aboutInfos.push(this.fb.group({ info: ['', Validators.required] }));
    }

    removeAboutInfo(index: number): void {
        if (this.aboutInfos.length > 1) {
            this.aboutInfos.removeAt(index);
        }
    }

    createVersionGroup(label = '', price = 0): FormGroup {
        return this.fb.group({
            label: [label, Validators.required],
            price: [price, [Validators.required, Validators.min(0)]],
        });
    }

    addVersion(): void {
        this.versions.push(this.createVersionGroup());
    }

    removeVersion(index: number): void {
        if (this.versions.length > 1) {
            this.versions.removeAt(index);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.editProduct && this.editProduct) {
            this.productForm.patchValue({
                title: this.editProduct.title,
                type: this.editProduct.type,
                description: this.editProduct.description,
                additionalLink: this.editProduct.extraLink || '',
                stock: this.editProduct.stock,
            });

            this.versions.clear();
            for (const v of this.editProduct.versions) {
                this.versions.push(this.createVersionGroup(v.label, v.price));
            }
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.selectedFile = input.files[0];
            this.imageInvalid = false;
        }
    }

    onSubmit(): void {
        this.productForm.markAllAsTouched();
        if (!this.productForm.valid || this.versions.length === 0) return;

        const formData = new FormData();
        formData.append('title', this.productForm.value.title.trim());
        formData.append('type', this.productForm.value.type.trim());
        formData.append('description', this.productForm.value.description.trim());
        formData.append('about', JSON.stringify(this.aboutInfos.value.map((i: any) => i.info.trim())));
        formData.append('additionalLink', this.productForm.value.additionalLink?.trim() || '');
        formData.append('stock', this.productForm.value.stock);

        // Append versions en JSON
        formData.append('versions', JSON.stringify(this.versions.value));

        if (this.selectedFile) formData.append('image', this.selectedFile);

        this.submitted.emit(formData);
        this.close();
    }

    close(): void {
        this.closed.emit();
    }
}
