import { PageGroup, TypePageBlock } from './page-block';

export const ABOUT_PAGE_GROUPS: PageGroup[] = [
    {
        title: `Présentation`,
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-title',
                data: { titre: 'QUI SOMMES-NOUS' },
            },
            {
                type: TypePageBlock.Custom,
                content: `<section class="presentation container">
  <h2>LA FONDATION FRANÇOIS MEYE</h2>
  <p>
    La fondation François MEYE est une organisation non gouvernementale gabonaise qui a été créé en juillet 2023. Elle a pour but de
    promouvoir l’éducation et la culture au Gabon, en particulier auprès des populations dans le besoin.
  </p>
</section>`,
            },
        ],
    },
    {
        title: `Nos valeurs`,
        blocks: [
            {
                type: TypePageBlock.Custom,
                content: `<section class="valeurs container">
  <div class="ligne-titre">
    <hr class="barre-gauche" />
    <h2>NOS VALEURS</h2>
    <hr class="barre-droite" />
  </div>
  <div class="valeurs-list">
    <span>Accessibilité</span>
    <span>Engagement</span>
    <span>Transmission</span>
    <span>Éthique</span>
    <span>Dévouement</span>
  </div>
</section>`,
            },
        ],
    },
    {
        title: `Objectif principal`,
        blocks: [
            {
                type: TypePageBlock.Custom,
                content: `<section class="objectif-principal">
  <p>Rendre accessible une éducation de qualité à plus de 2 millions de Gabonais d’ici 2030</p>
</section>`,
            },
        ],
    },
    {
        title: `Axes & Pourquoi une fondation`,
        blocks: [
            {
                type: TypePageBlock.Custom,
                content: `<section class="section-blocs">
  <div class="colonne">
    <h4>LES AXES D’ACTION</h4>
    <div class="bloc bleu">
      <i class="fa-solid fa-book-open"></i>
      <p>Renforcer l’encadrement et les outils d’apprentissage pour les apprenants</p>
    </div>
    <div class="bloc bleu-clair">
      <i class="fa-regular fa-clock"></i>
      <p>Soutenir la bonne formation et le bien-être au travail de l’enseignant</p>
    </div>
  </div>
  <div class="colonne">
    <h4>POURQUOI UNE FONDATION ?</h4>
    <div class="grid-2x2">
      <div class="bloc jaune">Structurer l’action</div>
      <div class="bloc marron">Agir vite au plus près</div>
      <div class="bloc bleu">Mobiliser des ressources</div>
      <div class="bloc gris">Fédérer les bonnes volontés</div>
    </div>
  </div>
</section>`,
            },
        ],
    },
    {
        title: `Biographie FM`,
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: `app-biography-fm`,
                data: {
                    resumeText: `
                    Premier instituteur d’Afrique équatoriale française et figure intellectuelle majeure du Gabon du 20e siècle.
    François MEYE a consacré sa vie à la promotion de la culture et de l’éducation. Il a également eu une carrière
    en tant qu’homme politique. M. MEYE a dirigé la liste électorale de la province du Moyen-Ogooué lors des
    élections à l’assemblée territoriale de 1957, vainqueur des trois sièges de la province.
                    `,
                    biographyFirstPart: `
                     François Méyé est un homme politique gabonais, le premier leader de la région du Moyen-Ogooué. <br />

            Il est né vers 1920 au lac Ayem dans l’actuelle région de Ndjolé. Il est du clan Essimviè. C’est un garçon extrêmement brillant que les
            enseignants et missionnaires protestants de l’Ogooué ont la joie d’avoir comme élève entre la fin des années 1920 et le milieu des années
            1930.
            <br />
            En 1937 il est admis à l’Ecole Supérieure du Gouvernement à Brazzaville, l’école qui forme la crème du corps enseignant laïc de l’AEF. Il
            en sort en novembre 1940, major de sa promotion ( Section normale) et devient alors le premier instituteur africain (AOF et AEF) à détenir
            le grade de bachelier. Il occupe alors pendant six ans les postes de Directeur d’école à Dolisie et à Brazzaville au Moyen Congo (
            ancienne A.E.F.)
            <br />
            
                    `,
                    biographySecondPart: ` En 1947, il est rappelé au Gabon où il doit remplacer l’icône l’enseignement, mr Davesnnes. La tâche est donc lourde puisqu’il est alors
            difficile de donner à un « africain » de remplacer un colon dans le secteur si sensible de l’éducation nationale. De 1947 à 1949 il est
            »Chef de Secteur Scolaire » dans la région du Woleu Ntem au Gabon. Il est à cette époque directeur de l’Ecole Régionale d’Oyem (ERO) où il
            dirige d’autres jeunes enseignants tels que Philippe Ndong Ndoutoume (20 ans et déjà brillant enseignant). Il se charge lui-même
            d’enseigner la classe de fin de cycle qui sanctionne la formation au métier d’enseignant. Et il a alors pour élève Moïse Oriand Nkoghe
            Mvé, un jeune garçon de 16 ans environ qui sera le père de Okoumba Nkoghe.
            <br />
            Ce dernier parle de François Meye ( dans un livre intitulé « Mémoires d’un instituteur sous la colonisation ») comme d’un homme beau,
            propre, fier et intelligent. François Meye est alors perçu par beaucoup comme un érudit car sa connaissance encyclopédique des
            littératures françaises, grecques, latines et africaines est riche et surprend. Il est aussi très éloquent. En 1949 à Oyem, lors de la
            célébration du 11 novembre qui rappelle la fin de la 1ère Guerre Mondiale, il tient en haleine des dizaines de blancs et de jeunes lettrés
            noirs avec un discours d’une heure où il indique que les deux peuples (français et gabonais) ne peuvent continuer à cohabiter que si les
            deux sont libres et égaux.
            <br />
            A partir de l’année 1956, il parcourt le Gabon pour défendre l’idée de l’indépendance. Pierre Moukala décédé en 2013 à l’âge de 85 ans,
            nous a raconté ceci: « La première fois que j’ai entendu quelqu’un parler d’indépendance à tout le monde, c’était en 1957 et c’est un
            monsieur appelé François Meye qui était venu à Mouila pour dire aux jeunes qu’il fallait savoir que quelque soit le temps le Gabon allait
            devenir indépendant ».
            <br />
            En 1957 il est élu à l’Assemblée Territoriale du Gabon, Devenue Assemblée Législative le 28 novembre 1958. Il est reélu Député le 12
            février 1961. François Méyé a été Membre du Gouvernement de la République Gabonaise du 9 novembre 1960 au 16 janvier 1964 Ministre des
            finances du 9 novembre 1960 au 20 février 1963. Il rejoint alors le camp de Léon Mba. Ministre du travail du 20 février 1963 au 16 janvier
            1964. Lors du coup d’Etat, il est épargné mais son nom est cité aux côtés de Jean-Hilaire Aubame et Jean-François Ondo Ndong comme l’un
            des seul capables de diriger le Gabon au cas où Léon Mba partait. Il a ensuite exercé les fonctions de Directeur de l’Enseignement au
            Ministère de l’Education Nationale de la République Gabonaise du 30 septembre 1965 au 5 août 1966. Promu Administrateur-Civil le 17
            décembre 1966, il a travaillé au ministère de l’information en qualité de Chargé de Mission, ce qui lui a permis de mettre au point une
            documentation sur « l’Histoire du Gabon ». Cet homme de culture s’est très tôt intéressé à la culture négro-africaine. Ses travaux
            littéraires ont été publiés dans diverses revues de l’ancienne A.E.F. et du Gabon.
            <br />
            Il écrit des nouvelles et des romans comme "Souvenirs de saison sèche », roman non encore édité et dont une partie a été publiée de 1942 à
            1944 dans le »Bulletin de l’Enseignement de l’A.E.F. Ce grand homme de culture a reçu la distinction de Chevalier de l’Ordre des Palmes
            Académiques.
            <br />
            Mais l’homme a une santé fragile. En 1949 déjà, selon Nkoghe Mvé Moïse, il est contraint de partir à Libreville et laisser son poste à
            Oyem. Selon ce qui se dit à cette époque, il travaille beaucoup, écrit énormément, ne se repose pas et finit par faire un surmenage. En
            novembre 1970, il meurt à l’hôpital général de Libreville dans les bras de Moïse Nkoghe Mvé qui était devenu son ami, en plus d’être son
            petit frère puisqu’ils étaient issus du même clan.`,
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
    //     {
    //         title: `Bureau exécutif`,
    //         blocks: [
    //             {
    //                 type: TypePageBlock.Custom,
    //                 content: `<section class="section-bureau">
    //   <h2>LES MEMBRES DU BUREAU EXÉCUTIF</h2>
    //   <div class="membres">
    //     <div class="membre">
    //       <img src="/assets/members/yannick.png" alt="Yannick EBIBIE NZE" class="photo" />
    //       <p class="nom">Yannick EBIBIE NZE</p>
    //       <p class="poste">Président</p>
    //     </div>
    //     <div class="membre">
    //       <img src="/assets/members/hans.png" alt="François Hans MEYE" class="photo ajuster-hans" />
    //       <p class="nom">François Hans MEYE</p>
    //       <p class="poste">Secrétaire Général</p>
    //     </div>
    //     <div class="membre">
    //       <img src="/assets/members/noemy.png" alt="Noémy OBAME" class="photo" />
    //       <p class="nom">Noémy OBAME</p>
    //       <p class="poste">Trésorière</p>
    //     </div>
    //     <div class="membre">
    //       <img src="/assets/members/ulrich.png" alt="Ulrich Ndong" class="photo ajuster-ulrich" />
    //       <p class="nom">Ulrich Ndong</p>
    //       <p class="poste">Responsable Communication</p>
    //     </div>
    //     <div class="membre">
    //       <img src="/assets/members/carolina.png" alt="Carolina Kourouna" class="photo ajuster-carolina" />
    //       <p class="nom">Carolina Kourouna</p>
    //       <p class="poste">Responsable Programmes</p>
    //     </div>
    //   </div>
    // </section>`,
    //             },
    //         ],
    //     },
    {
        title: `Bureau exécutif`,
        blocks: [
            {
                type: TypePageBlock.Custom,
                componentKey: 'app-executive-members',
                data: {
                    members: [
                        {
                            name: 'Yannick EBIBIE NZE',
                            role: 'Président',
                            imageUrl: '/assets/members/yannick.png',
                        },
                        {
                            name: 'François Hans MEYE',
                            role: 'Secrétaire Général',
                            imageUrl: '/assets/members/hans.png',
                        },
                        {
                            name: 'Noémy OBAME',
                            role: 'Trésorière',
                            imageUrl: '/assets/members/noemy.png',
                        },
                        {
                            name: 'Ulrich Ndong',
                            role: 'Responsable Communication',
                            imageUrl: '/assets/members/ulrich.png',
                        },
                        {
                            name: 'Carolina Kourouna',
                            role: 'Responsable Programmes',
                            imageUrl: '/assets/members/carolina.png',
                        },
                        {
                            name: 'Carolina Kourouna',
                            role: 'Responsable Programmes',
                            imageUrl: '/assets/members/carolina.png',
                        },
                        {
                            name: 'Carolina Kourouna',
                            role: 'Responsable Programmes',
                            imageUrl: '/assets/members/carolina.png',
                        },
                    ],
                },
            },
        ],
    },
];
