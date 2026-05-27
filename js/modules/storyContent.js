export const storyVersions = {
    dissection: {
        title: 'Aortendissektion',
        nav: [
            { href: '#s1', label: 'Einführung' },
            { href: '#s4', label: 'Anatomie' },
            { href: '#s6', label: 'Ursachen' },
            { href: '#s8', label: 'Diagnose' },
            { href: '#s11', label: 'Verlauf' },
            { href: '#s13', label: 'Therapie' },
            { href: '#s16', label: 'Nachsorge' }
        ],
        sections: [
            {
                title: '1. Die Lebensader',
                paragraphs: [
                    'Die <span class="tech-term" data-term="aorta">Aorta</span> ist die zentrale Hochdruckleitung des Körpers. Jede Herzaktion presst Blut durch ihre elastische Wand.',
                    'Bei einer Dissektion entsteht ein Riss in der inneren Gefäßschicht. Blut dringt in die Wand ein und spaltet sie auf.'
                ],
                statIcon: 'A',
                statLabel: 'Fokus:',
                statText: 'Akuter Einriss der Aortenwand.'
            },
            {
                title: '2. Das ist Rainer',
                paragraphs: [
                    'Rainer, 61 Jahre alt, ist aktiv und fühlt sich belastbar.',
                    'An einem normalen Morgen spürt er plötzlich einen starken Schmerz in Brust und Rücken.'
                ],
                statIcon: 'R',
                statLabel: 'Patient:',
                statText: 'Rainer, 61 Jahre alt.'
            },
            {
                title: '3. Die akute Gefahr',
                paragraphs: [
                    'Eine Aortendissektion kann innerhalb weniger Minuten lebensbedrohlich werden.',
                    'Entscheidend ist, wie schnell die Diagnose gestellt und die richtige Therapie eingeleitet wird.'
                ],
                statIcon: '!',
                statLabel: 'Notfall:',
                statText: 'Zeitkritische Gefäßerkrankung.'
            },
            {
                title: '4. Gesunde Anatomie',
                paragraphs: [
                    'Die gesunde Aorta besteht aus mehreren Wandschichten. Diese Schichten halten Druck, Dehnung und Blutstrom normalerweise stabil zusammen.'
                ],
                statIcon: '3D',
                statLabel: 'Funktion:',
                statText: 'Mehrschichtige Gefäßwand.'
            },
            {
                title: '5. Der Einriss',
                paragraphs: [
                    'Bei der Dissektion reisst die innere Schicht ein. Das Blut sucht sich einen zweiten Kanal in der Wand, das sogenannte falsche Lumen.',
                    'Dadurch können wichtige Abzweigungen der Aorta schlechter versorgt werden.'
                ],
                statIcon: 'X',
                statLabel: 'Mechanismus:',
                statText: 'Wandspaltung durch Blutstrom.'
            },
            {
                title: '6. Biologische Ursachen',
                paragraphs: [
                    'Bindegewebserkrankungen, genetische Faktoren und degenerative Wandveränderungen können die Aorta anfälliger machen.'
                ],
                placeholderId: 's6-placeholder',
                placeholderText: '3D-Modell: biologische Risikostrukturen',
                statIcon: 'DNA',
                statLabel: 'Ursache:',
                statText: 'Strukturelle Wandinstabilitat.',
                iconGrid: [
                    { icon: 'DNA', label: 'Genetik' },
                    { icon: 'M', label: 'Bindegewebe' }
                ]
            },
            {
                title: '7. Lebensstil & Belastung',
                paragraphs: [
                    'Bluthochdruck ist einer der wichtigsten beeinflussbaren Risikofaktoren. Er erhöht die mechanische Belastung auf die Gefäßwand dauerhaft.'
                ],
                statIcon: 'BP',
                statLabel: 'Risikofaktor:',
                statText: 'Chronischer Hochdruck.',
                iconImages: [
                    { src: 'assets/icons/1.png', alt: 'Risiko Icon 1' },
                    { src: 'assets/icons/2.png', alt: 'Risiko Icon 2' },
                    { src: 'assets/icons/3.png', alt: 'Risiko Icon 3' }
                ]
            },
            {
                title: '8. Klinische Symptome',
                paragraphs: [
                    'Typisch ist ein plötzlicher, sehr starker Schmerz in Brust, Rücken oder Bauch. Die Beschwerden können wandern, wenn sich die Spaltung ausbreitet.'
                ],
                placeholderId: 's8-placeholder',
                placeholderText: '3D-Modell: Schmerz- und Ausbreitungszonen',
                statIcon: 'S',
                statLabel: 'Symptom:',
                statText: 'Plötzlicher Vernichtungsschmerz.'
            },
            {
                title: '9. Diagnostische Verfahren',
                paragraphs: [
                    'Bei Verdacht zählt jede Minute. CT-Angiographie, Echokardiographie und Laborwerte helfen, die Dissektion rasch einzuordnen.'
                ],
                statIcon: 'CT',
                statLabel: 'Diagnose:',
                statText: 'Schnelle Bildgebung.'
            },
            {
                title: '10. Bildgebung',
                paragraphs: [
                    'Die Bildgebung zeigt, wo der Einriss beginnt, wie weit sich die Dissektion ausdehnt und ob Organe gefährdet sind.'
                ],
                statIcon: 'M',
                statLabel: 'Präzision:',
                statText: 'Lokalisation von Entry und Ausdehnung.'
            },
            {
                title: '11. Wirkmechanismus',
                paragraphs: [
                    'Im falschen Lumen können Druckspitzen und turbulente Strömungen entstehen. Sie belasten die Wand und können den echten Blutkanal einengen.'
                ],
                statIcon: 'F',
                statLabel: 'Flow:',
                statText: 'Dynamik zwischen echtem und falschem Lumen.'
            },
            {
                title: '12. Krankheitsstadien',
                paragraphs: [
                    'Die Einteilung richtet sich nach Lage und Ausdehnung. Besonders kritisch sind Dissektionen, die die aufsteigende Aorta betreffen.'
                ],
                statIcon: 'I',
                statLabel: 'Einteilung:',
                statText: 'Typ A und Typ B.'
            },
            {
                title: '13. Behandlungsoptionen',
                paragraphs: [
                    'Die Therapie hängt von Typ, Stabilität und Organversorgung ab. Ziel ist es, die Wandspaltung zu stoppen und Komplikationen zu verhindern.'
                ],
                statIcon: 'Rx',
                statLabel: 'Therapie:',
                statText: 'Druckkontrolle und Stabilisierung.',
                iconGrid: [
                    { icon: 'Rx', label: 'Medikation' },
                    { icon: 'OP', label: 'Eingriff' }
                ]
            },
            {
                title: '14. Die Rettung',
                paragraphs: [
                    'Bei Typ-A-Dissektionen ist häufig eine Operation notwendig. Bei geeigneten Typ-B-Verläufen kann ein Stent-Graft den Einriss abdichten.'
                ],
                statIcon: 'EV',
                statLabel: 'Verfahren:',
                statText: 'Operation oder endovaskulare Therapie.'
            },
            {
                title: '15. Risiken & Nutzen',
                paragraphs: [
                    'Frühes Handeln verbessert die Prognose deutlich. Unbehandelt kann eine Dissektion zu Ruptur, Schlaganfall oder Organischämie führen.'
                ],
                statIcon: '%',
                statLabel: 'Nutzen:',
                statText: 'Komplikationen vermeiden.'
            },
            {
                title: '16. Rainers Ausblick',
                paragraphs: [
                    'Nach der Akutbehandlung beginnt die Nachsorge. Blutdruck, Bildgebung und Belastungssteuerung bleiben wichtige Begleiter.'
                ],
                statIcon: 'N',
                statLabel: 'Nachsorge:',
                statText: 'Regelmäßige Kontrolle.'
            },
            {
                title: '17. Präventionstipps',
                paragraphs: [
                    'Blutdruck kennen, Medikamente konsequent einnehmen und Warnzeichen ernst nehmen: Diese Schritte reduzieren das Risiko schwerer Verläufe.'
                ],
                statIcon: 'H',
                statLabel: 'Prävention:',
                statText: 'Druck senken, Risiko senken.',
                iconGrid: [
                    { icon: 'BP', label: 'Blutdruck' },
                    { icon: 'CT', label: 'Kontrolle' }
                ]
            },
            {
                title: '18. Fazit',
                paragraphs: [
                    'Die Aortendissektion ist selten, aber dramatisch. Wer Symptome erkennt und schnell handelt, gewinnt entscheidende Zeit.'
                ],
                statIcon: '!',
                statLabel: 'Take-Home:',
                statText: 'Akute Schmerzen sofort abklären.'
            }
        ]
    },
    aneurysm: {
        title: 'Aortenaneurysma',
        nav: [
            { href: '#s1', label: 'Einführung' },
            { href: '#s4', label: 'Anatomie' },
            { href: '#s6', label: 'Ursachen' },
            { href: '#s8', label: 'Diagnose' },
            { href: '#s11', label: 'Verlauf' },
            { href: '#s13', label: 'Therapie' },
            { href: '#s16', label: 'Prävention' }
        ],
        sections: [
            {
                title: '1. Die Lebensader',
                paragraphs: [
                    'Die <span class="tech-term" data-term="aorta">Aorta</span> ist das Herzstück unseres Kreislaufs. Jedes Jahr pumpt sie Millionen Liter Blut durch den Körper.',
                    'Doch wie stabil ist diese Leitung wirklich?'
                ],
                statIcon: 'A',
                statLabel: 'Fokus:',
                statText: 'Zentrale Rolle im Blutkreislauf.'
            },
            {
                title: '2. Das ist Rainer',
                paragraphs: [
                    'Rainer, 61 Jahre alt, ist leidenschaftlicher Wanderer. Er fühlt sich fit und gesund.',
                    'Er ahnt jedoch nichts von der tickenden Zeitbombe in seinem Bauch.'
                ],
                statIcon: 'R',
                statLabel: 'Patient:',
                statText: 'Rainer, 61 Jahre alt.'
            },
            {
                title: '3. Die stumme Gefahr',
                paragraphs: [
                    'Bis zu 5 Prozent aller Männer über 65 Jahre tragen eine krankhafte Erweiterung der Aorta in sich.',
                    'Meist bleibt dies über Jahre völlig unentdeckt.'
                ],
                statIcon: '%',
                statLabel: 'Statistik:',
                statText: '1 von 20 Männern über 65 betroffen.'
            },
            {
                title: '4. Gesunde Anatomie',
                paragraphs: [
                    'Eine gesunde Aorta ist elastisch und glattwandig. Sie fungiert als Windkessel, der den stoßweisen Blutfluss des Herzens ausgleicht.'
                ],
                statIcon: '3D',
                statLabel: 'Funktion:',
                statText: 'Elastischer Windkessel.'
            },
            {
                title: '5. Pathologische Veränderung',
                paragraphs: [
                    'Bei Rainer hat die Gefäßwand nachgegeben. Es hat sich ein <span class="tech-term" data-term="aneurysma">Aneurysma</span> gebildet: eine sackartige Ausbeulung, die reißen könnte.'
                ],
                statIcon: '!',
                statLabel: 'Gefahr:',
                statText: 'Risiko einer Ruptur.'
            },
            {
                title: '6. Biologische Ursachen',
                paragraphs: [
                    'Oft spielt die Genetik eine Rolle. Bindegewebsschwächen wie das Marfan-Syndrom schwächen die Struktur der Aorta von Geburt an.'
                ],
                placeholderId: 's6-placeholder',
                placeholderText: '3D-Modell: s6_biologie.glb, ersetzt durch dna.glb',
                statIcon: 'DNA',
                statLabel: 'Ursache:',
                statText: 'Genetische Veranlagung.',
                iconGrid: [
                    { icon: 'DNA', label: 'Genetik' },
                    { icon: 'A', label: 'Alterung' }
                ]
            },
            {
                title: '7. Lebensstil & Umwelt',
                paragraphs: [
                    'Bluthochdruck ist der Feind Nummer eins. Er drückt permanent gegen die Gefäßwand. Rauchen und schlechte Cholesterinwerte beschleunigen den Verschleiß.'
                ],
                statIcon: 'BP',
                statLabel: 'Risikofaktor:',
                statText: 'Lebensstil beeinflussbar.',
                iconImages: [
                    { src: 'assets/icons/1.png', alt: 'Risiko Icon 1' },
                    { src: 'assets/icons/2.png', alt: 'Risiko Icon 2' },
                    { src: 'assets/icons/3.png', alt: 'Risiko Icon 3' }
                ]
            },
            {
                title: '8. Klinische Symptome',
                paragraphs: [
                    'Ein Aneurysma schmerzt meist nicht. Erst wenn es zu einem Riss kommt, tritt ein vernichtender, messerscharfer Schmerz auf.'
                ],
                placeholderId: 's8-placeholder',
                placeholderText: '3D-Modell: s8_symptome.glb, ersetzt durch dna.glb',
                statIcon: 'S',
                statLabel: 'Symptom:',
                statText: 'Akuter Vernichtungsschmerz.'
            },
            {
                title: '9. Diagnostische Verfahren',
                paragraphs: [
                    'Die Rettung ist oft ein Zufallsbefund. Ein einfacher Ultraschall des Bauches reicht aus, um die Gefahr sicher zu identifizieren.'
                ],
                statIcon: 'US',
                statLabel: 'Früherkennung:',
                statText: 'Schmerzfrei und sicher.'
            },
            {
                title: '10. Bildgebung',
                paragraphs: [
                    'In der Computertomographie wird das Ausmaß sichtbar. Chirurgen nutzen diese Bilder, um Rainers Operation zu planen.'
                ],
                statIcon: 'CT',
                statLabel: 'Präzision:',
                statText: 'Millimetergenaue Vermessung.'
            },
            {
                title: '11. Wirkmechanismus',
                paragraphs: [
                    'Physik in der Aorta: In der Ausbeulung entstehen gefährliche Wirbel. Der Blutstrom wird turbulent und belastet die Wand.'
                ],
                statIcon: 'F',
                statLabel: 'Fokus:',
                statText: 'Wandschubspannung.'
            },
            {
                title: '12. Krankheitsstadien',
                paragraphs: [
                    'Ab 5,5 cm steigt das Rupturrisiko deutlich an. Rainer liegt bereits bei kritischen 5,8 cm.'
                ],
                statIcon: '5.5',
                statLabel: 'Grenzwert:',
                statText: '5,5 cm = OP-Indikation.'
            },
            {
                title: '13. Behandlungsoptionen',
                paragraphs: [
                    'Medikamente senken den Druck, doch ab einer gewissen Größe hilft nur Mechanik: Die Aorta muss verstärkt werden.'
                ],
                statIcon: 'Rx',
                statLabel: 'Therapie:',
                statText: 'Fokus auf Stabilisierung.',
                iconGrid: [
                    { icon: 'Rx', label: 'Pillen' },
                    { icon: 'OP', label: 'Technik' }
                ]
            },
            {
                title: '14. Die Rettung',
                paragraphs: [
                    'Ein Stent-Graft wird minimalinvasiv eingeführt. Er entfaltet sich und leitet das Blut sicher an der Schwachstelle vorbei.'
                ],
                statIcon: 'EV',
                statLabel: 'Verfahren:',
                statText: 'EVAR.'
            },
            {
                title: '15. Risiken & Nutzen',
                paragraphs: [
                    'Kein Eingriff ohne Risiko. Doch für Rainer ist der Nutzen klar: Ohne den Stent wäre die Gefahr eines Risses extrem hoch.'
                ],
                statIcon: '%',
                statLabel: 'Erfolg:',
                statText: 'Überlebensrate > 95 Prozent.'
            },
            {
                title: '16. Rainers Ausblick',
                paragraphs: [
                    'Drei Monate nach der Operation: Rainer steht wieder auf dem Gipfel. Er hat seine Lebensqualität zurückgewonnen.'
                ],
                statIcon: 'N',
                statLabel: 'Erfolg:',
                statText: 'Zurück im Alltag.'
            },
            {
                title: '17. Präventionstipps',
                paragraphs: [
                    'Kennen Sie Ihren Blutdruck. Ab 65 Jahren sollten Sie das Ultraschall-Screening wahrnehmen.'
                ],
                statIcon: 'H',
                statLabel: 'Vorsorge:',
                statText: 'Screening ab 65.',
                iconGrid: [
                    { icon: 'H', label: 'Check-Up' },
                    { icon: 'L', label: 'Lifestyle' }
                ]
            },
            {
                title: '18. Fazit',
                paragraphs: [
                    'Die Aorta ist leise, bis sie schreit. Früherkennung rettet Leben. Passen Sie auf Ihre Lebensader auf.'
                ],
                statIcon: '*',
                statLabel: 'Take-Home:',
                statText: 'Blutdruck messen - Leben retten.'
            }
        ]
    }
};
