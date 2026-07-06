import { Component } from '@angular/core';
import { BiographyFmComponent } from '@app/components/biography-fm/biography-fm.component';
import { FooterComponent } from '@app/components/footer/footer.component';
import { MissionsComponent } from '@app/components/missions/missions.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { TitleComponent } from '@app/components/title/title.component';

@Component({
    selector: 'app-fondation-page',
    standalone: true,
    imports: [NavbarComponent, FooterComponent, TitleComponent, BiographyFmComponent, MissionsComponent],
    templateUrl: './fondation-page.component.html',
    styleUrl: './fondation-page.component.scss',
})
export class FondationPageComponent {}
