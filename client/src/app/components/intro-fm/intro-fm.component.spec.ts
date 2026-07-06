import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntroFMComponent } from './intro-fm.component';

describe('IntroFMComponent', () => {
    let component: IntroFMComponent;
    let fixture: ComponentFixture<IntroFMComponent>;

    // variables pour capturer l'observer simulé
    let observeSpy: jasmine.Spy;
    let observerCallback: IntersectionObserverCallback;

    beforeEach(async () => {
        // mock de IntersectionObserver
        class FakeIntersectionObserver {
            constructor(callback: IntersectionObserverCallback) {
                observerCallback = callback;
            }

            observe = (observeSpy = jasmine.createSpy('observe'));
            disconnect() {}
            unobserve() {}
        }

        // remplace le constructeur global
        (window as any).IntersectionObserver = FakeIntersectionObserver;

        await TestBed.configureTestingModule({
            imports: [IntroFMComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(IntroFMComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should add .in-view to elements when intersecting', () => {
        // Arrange
        const element = document.createElement('div');
        element.classList.add('animate-on-scroll');
        document.body.appendChild(element);

        // Act
        component.ngAfterViewInit();

        // Assert
        expect(observeSpy).toHaveBeenCalledWith(element);

        // Simuler l'intersection
        observerCallback([{ target: element, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
        expect(element.classList.contains('in-view')).toBeTrue();

        // Cleanup
        document.body.removeChild(element);
    });
});
