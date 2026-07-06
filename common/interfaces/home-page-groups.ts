import { PageGroup, TypePageBlock } from './page-block';

export const HOME_PAGE_GROUPS: PageGroup[] = [
    {
        title: 'Section Intro',
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-intro',
                data: {
                    titrePrincipal: 'INVESTIR DANS L’ÉDUCATION',
                    boutonTexte: 'Découvrir la fondation',
                },
            },
        ],
    },
    {
        title: 'Citation FM',
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-intro-fm',
                data: {
                    citation: 'Honte à celui qui ne fera pas mieux que son père',
                    linkText: 'Découvrir François Méyé',
                },
            },
        ],
    },
    {
        title: `Nos missions`,
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-missions',
                data: {
                    missions: [
                        {
                            imageUrl: '/assets/teacher.png',
                            description: 'Rendre accessible l’enseignement aux populations les moins favorisées',
                        },
                        {
                            imageUrl: '/assets/thinker.png',
                            description: 'Promouvoir l’innovation en matière d’éducation',
                        },
                        {
                            imageUrl: '/assets/bureau_livre.png',
                            description: 'Contribuer à l’amélioration des conditions de travail et d’apprentissage dans l’enseignement',
                        },
                        {
                            imageUrl: '/assets/star.png',
                            description: 'Promouvoir l’excellence et le dévouement dans l’enseignement',
                        },
                        {
                            imageUrl: '/assets/learner.png',
                            description: 'Valoriser le métier de l’enseignant',
                        },
                        {
                            imageUrl: '/assets/leve_main.png',
                            description: 'Encourager et promouvoir la réussite scolaire',
                        },
                    ],
                },
            },
        ],
    },
    {
        title: 'Galerie',
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-galerie-access',
            },
        ],
    },
    {
        title: 'Actualités',
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-news',
            },
        ],
    },
    {
        title: 'Support',
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-support',
                data: {
                    cartes: [
                        {
                            titre: 'Devenir membre',
                            description: `En devenant membre, vous rejoignez une communauté engagée qui partage les valeurs de solidarité et d’éducation. 
                            C’est un moyen concret de contribuer à nos actions tout en bénéficiant d’informations exclusives sur nos projets.`,

                            boutonTexte: 'En savoir plus',
                            lien: '/membre',
                            imageUrl: '/assets/together.jpg',
                            overlayClass: 'bleue',
                        },
                        {
                            titre: 'Faire un don',
                            description: `Vos dons permettent à la fondation de financer ses programmes éducatifs et 
                            d’accompagner durablement les enseignants et les élèves dans des zones défavorisées. 
                            Chaque contribution fait une réelle différence.`,

                            boutonTexte: 'Faire un don',
                            lien: '/don',
                            imageUrl: '/assets/volunteers.png',
                            overlayClass: 'jaune',
                        },
                        {
                            titre: 'Aller à la boutique',
                            description: `Découvrez des produits solidaires qui véhiculent les valeurs de la fondation. 
                            En achetant dans notre boutique, vous soutenez directement nos actions tout en portant fièrement nos couleurs.`,

                            boutonTexte: 'Accéder à la boutique',
                            lien: '/boutique',
                            imageUrl: '/assets/book.jpg',
                            overlayClass: '',
                        },
                    ],
                },
            },
        ],
    },
    {
        title: 'Partenaires',
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-partner',
                data: {
                    partners: [
                        {
                            imageUrl: '/assets/partners/education-nationale.jpeg',
                            alt: 'Éducation nationale',
                        },
                        {
                            imageUrl: '/assets/partners/ministere-culture.png',
                            alt: 'Ministère de la Culture',
                        },
                        {
                            imageUrl: '/assets/partners/affaires-sociales.jpeg',
                            alt: 'Ministère des Affaires Sociales',
                        },
                        {
                            imageUrl: '/assets/partners/sing.png',
                            alt: 'SING',
                        },
                        {
                            imageUrl: '/assets/partners/sikul.png',
                            alt: 'Sikul',
                        },
                        {
                            imageUrl: '/assets/partners/gabon24.jpg',
                            alt: 'Gabon24',
                        },
                        {
                            imageUrl: '/assets/partners/cgc.webp',
                            alt: 'CGC',
                        },
                    ],
                },
                size: { width: 100, height: 100 },
            },
        ],
    },
];
