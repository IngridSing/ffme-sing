import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FooterComponent } from '@app/components/footer/footer.component';
import { NavbarComponent } from '@app/components/navbar/navbar.component';

@Component({
    selector: 'app-failed-membership-page',
    standalone: true,
    imports: [NavbarComponent, RouterLink, FooterComponent],
    templateUrl: './failed-membership-page.component.html',
    styleUrl: './failed-membership-page.component.scss',
})
export class FailedMembershipPageComponent implements OnInit {
    id: string = '';

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.id = this.route.snapshot.paramMap.get('membershipId') || '';
    }
}
