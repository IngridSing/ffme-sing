import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalerieAccessComponent } from './galerie-access.component';

describe('GalerieAccessComponent', () => {
    let component: GalerieAccessComponent;
    let fixture: ComponentFixture<GalerieAccessComponent>;

    // Variables pour gérer le faux observer
    let mockObserve: jasmine.Spy;
    let mockUnobserve: jasmine.Spy;
    let observerCallback: IntersectionObserverCallback;

    beforeEach(() => {
        // Simulation propre du constructeur de IntersectionObserver
        mockObserve = jasmine.createSpy('observe');
        mockUnobserve = jasmine.createSpy('unobserve');

        class FakeIntersectionObserver {
            constructor(callback: IntersectionObserverCallback) {
                observerCallback = callback;
            }

            observe = mockObserve;
            unobserve = mockUnobserve;
            disconnect() {}
        }

        // Remplace globalement IntersectionObserver par le faux
        (window as any).IntersectionObserver = FakeIntersectionObserver;

        TestBed.configureTestingModule({
            imports: [GalerieAccessComponent],
        });

        fixture = TestBed.createComponent(GalerieAccessComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should observe .animate-on-scroll elements and add .in-view when intersecting', () => {
        const element = document.createElement('div');
        element.classList.add('animate-on-scroll');
        document.body.appendChild(element);

        // Lancer le hook
        component.ngAfterViewInit();

        // Vérifie que observe est appelé sur l’élément
        expect(mockObserve).toHaveBeenCalledWith(element);

        // Simule l’intersection
        observerCallback([{ target: element, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

        expect(element.classList.contains('in-view')).toBeTrue();
        expect(mockUnobserve).toHaveBeenCalledWith(element);

        // Nettoyage DOM
        document.body.removeChild(element);
    });
});
