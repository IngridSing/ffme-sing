import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '@app/components/footer/footer.component';
import { GalerieAccessComponent } from '@app/components/galerie-access/galerie-access.component';
import { IntroFMComponent } from '@app/components/intro-fm/intro-fm.component';
import { IntroComponent } from '@app/components/intro/intro.component';
import { MissionsComponent } from '@app/components/missions/missions.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { NewsComponent } from '@app/components/news/news.component';
import { PartnerComponent } from '@app/components/partner/partner.component';
import { SupportComponent } from '@app/components/support/support.component';
import { VideosComponent } from '@app/components/videos/videos.component';
import { CommunicationService } from '@app/services/communication/comm/communication.service';
import { Message } from '@common/interfaces/message';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-main-page',
    standalone: true,
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [
        NavbarComponent,
        IntroComponent,
        PartnerComponent,
        GalerieAccessComponent,
        NewsComponent,
        VideosComponent,
        IntroFMComponent,
        SupportComponent,
        MissionsComponent,
        FooterComponent,
        RouterLink,
    ],
})
export class MainPageComponent implements AfterViewInit {
    readonly title: string = 'LOG2990';
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');

    constructor(private readonly communicationService: CommunicationService) {}

    ngAfterViewInit(): void {
        const navBar = document.querySelector('.nav-bar');
        const sentinelle = document.querySelector('#sentinelle');

        if (navBar && sentinelle) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        navBar.classList.add('stopped');
                    } else {
                        navBar.classList.remove('stopped');
                    }
                },
                {
                    root: null, // observe le viewport global
                    threshold: 0.1, // dès que 10% du sentinelle est visible
                },
            );

            observer.observe(sentinelle);
        } else {
            console.warn('nav-bar or sentinelle not found');
        }
    }

    sendTimeToServer(): void {
        const newTimeMessage: Message = {
            title: 'Hello from the client',
            body: 'Time is : ' + new Date().toString(),
        };
        // Important de ne pas oublier "subscribe" ou l'appel ne sera jamais lancé puisque personne l'observe
        this.communicationService.basicPost(newTimeMessage).subscribe({
            next: (response) => {
                const responseString = `Le serveur a reçu la requête a retourné un code ${response.status} : ${response.statusText}`;
                this.message.next(responseString);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    getMessagesFromServer(): void {
        this.communicationService
            .basicGet()
            // Cette étape transforme l'objet Message en un seul string
            .pipe(
                map((message: Message) => {
                    return `${message.title} ${message.body}`;
                }),
            )
            .subscribe(this.message);
    }
}
