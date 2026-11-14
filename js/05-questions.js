'use strict';
/* ===================== DANE: POZIOMY, PYTANIA ===================== */
const TIERS = ['easy', 'mid', 'hard'];
const DIFFS = {
  easy: { id: 'easy', name: 'Łatwy', icon: '🌱', btn: 'b-mint', pill: 'gr', mult: 1,   desc: 'Proste pytania i spokojne gierki' },
  mid:  { id: 'mid',  name: 'Średni', icon: '🔥', btn: 'b-peach', pill: 'pk', mult: 1.5, desc: 'Trudniejsze pytania i szybsze gierki' },
  hard: { id: 'hard', name: 'Trudny', icon: '🚀', btn: 'b-pink', pill: 'rd', mult: 2, desc: 'Wyzwanie dla prawdziwych astronautów' },
};
const MISSIONS = [
  { id: 1, title: 'MeowMission 1: Ubranie', icon: '🧑‍🚀', color: '#FFE3C6', topic: '🌌', qs: {
    easy: [
      { q: 'Co astronauta zakłada, zanim wyjdzie w kosmos?', a: 'Skafander', w: ['Klapki', 'Kapelusz', 'Piżamę'] },
      { q: 'Czym astronauta pracuje na stacji?', a: 'Laptopem', w: ['Pianinem', 'Rowerem', 'Szczotką'] },
      { q: 'Co astronauta ma na głowie w skafandrze?', a: 'Hełm', w: ['Kapelusz', 'Koronę', 'Czapkę z pomponem'] },
      { q: 'Co astronauta nosi na rękach w skafandrze?', a: 'Rękawice', w: ['Opaski', 'Bransoletki', 'Skarpetki'] },
      { q: 'Ile nóg ma astronauta?', a: 'Dwie', w: ['Cztery', 'Sześć', 'Osiem'] },
      { q: 'Co astronauta zabiera na stację, żeby pisać notatki?', a: 'Tablet', w: ['Młotek', 'Bęben', 'Banan'] },
    ],
    mid: [
      { q: 'Po co astronaucie skafander podczas spaceru kosmicznego?', a: 'Chroni przed próżnią i temperaturą', w: ['Żeby było ciszej', 'Żeby nie zgubić się w kosmosie', 'Żeby ładnie wyglądać'], f: 'W kosmosie nie ma powietrza, a temperatura skacze od bardzo zimnej do bardzo gorącej.' },
      { q: 'Jak nazywa się wyjście astronauty na zewnątrz stacji?', a: 'Spacer kosmiczny', w: ['Skok orbitalny', 'Lot balonem', 'Kosmiczny trening'], f: 'Spacery kosmiczne trwają nawet kilka godzin.' },
      { q: 'Dlaczego astronauci na stacji unoszą się w powietrzu?', a: 'Razem ze stacją ciągle spadają wokół Ziemi', w: ['W kosmosie nie ma grawitacji', 'Mają magnetyczne buty', 'Powietrze ich unosi'], f: 'Na wysokości stacji grawitacja nadal działa, prawie jak na Ziemi!' },
      { q: 'Co robią astronauci, żeby nie tracić siły mięśni?', a: 'Codziennie ćwiczą', w: ['Śpią całe dni', 'Jedzą tylko słodycze', 'Nic, mięśnie rosną same'], f: 'Astronauci ćwiczą około 2 godzin każdego dnia.' },
      { q: 'Jak astronauci śpią na stacji?', a: 'W workach przypiętych do ściany', w: ['W łóżkach z poduszką', 'Na suficie bez niczego', 'W wannie z wodą'], f: 'Gdyby się nie przypięli, mogliby odpłynąć przez sen.' },
      { q: 'Dlaczego okruchy są problemem na stacji?', a: 'Unoszą się i mogą dostać się do sprzętu', w: ['Zjadają je roboty', 'Zamieniają się w wodę', 'Świecą w ciemności'], f: 'Dlatego astronauci jedzą tortille zamiast zwykłego chleba.' },
    ],
    hard: [
      { q: 'Dlaczego astronauci w kosmosie stają się nieco wyżsi?', a: 'Kręgosłup rozciąga się bez nacisku grawitacji', w: ['Rosną od promieniowania', 'Skafander ich rozciąga', 'Jedzą specjalne tabletki'], f: 'Po powrocie na Ziemię wracają do dawnego wzrostu.' },
      { q: 'Skąd astronauta pije podczas spaceru kosmicznego?', a: 'Z woreczka z wodą w skafandrze', w: ['Z butelki przypiętej na zewnątrz', 'Z kranu na stacji przez długą rurkę', 'Nie pije, bo nie może'], f: 'Woreczek mieści około litra wody.' },
      { q: 'Dlaczego skafander NASA jest biały?', a: 'Odbija światło Słońca i chroni przed przegrzaniem', w: ['Żeby go było widać w nocy', 'Bo biała farba jest tańsza', 'Żeby przypominał śnieg'], f: 'W pełnym Słońcu w kosmosie robi się ponad 100°C.' },
      { q: 'Do czego służy bielizna MAG pod skafandrem?', a: 'Do chłonięcia podczas wielogodzinnych prac', w: ['Do ogrzewania stóp', 'Do chowania narzędzi', 'Do ochrony przed meteorytami'], f: 'MAG to skrót od Maximum Absorbency Garment.' },
      { q: 'Jak chłodzi się ciało astronauty w skafandrze?', a: 'Bielizną z rurkami z zimną wodą', w: ['Kamizelką z lodu', 'Futrzaną bluzą', 'Małym wiatrakiem'], f: 'Ciepło odprowadza woda krążąca w cienkich rurkach.' },
      { q: 'Ile godzin może trwać jeden spacer kosmiczny?', a: 'Nawet około 7 godzin', w: ['Zawsze 5 minut', 'Około 2 dni', 'Dokładnie godzinę'], f: 'Najdłuższe spacery trwały ponad 8 godzin.' },
    ] } },
  { id: 2, title: 'MeowMission 2: Tlen i Słońce', icon: '🛰️', color: '#CDEBFF', topic: '☀️', qs: {
    easy: [
      { q: 'Czym astronauta oddycha?', a: 'Tlenem', w: ['Cukierkiem', 'Piaskiem', 'Sokiem'] },
      { q: 'Czego rośliny potrzebują, żeby rosnąć?', a: 'Światła', w: ['Lodów', 'Muzyki', 'Cukru'] },
      { q: 'Co astronauci piją na stacji?', a: 'Wodę', w: ['Piasek', 'Kamień', 'Błoto'] },
      { q: 'Co zamienia światło w prąd?', a: 'Panel słoneczny', w: ['Lodówka', 'Szczotka', 'Gumowa kaczka'] },
      { q: 'Co daje prąd w nocy?', a: 'Bateria', w: ['Kometa', 'Choinka', 'Balon'] },
      { q: 'Co chroni przed promieniowaniem?', a: 'Osłona', w: ['Parasol', 'Kapcie', 'Pizza'] },
    ],
    mid: [
      { q: 'Skąd stacja ISS bierze prąd?', a: 'Z ogromnych paneli słonecznych', w: ['Z kabla od Ziemi', 'Z wiatraka', 'Z wodospadu'], f: 'Panele ISS są ogromne i obracają się za Słońcem.' },
      { q: 'Jak stacja ISS wytwarza tlen do oddychania?', a: 'Rozkłada wodę prądem', w: ['Wciąga go z kosmosu', 'Wydmuchują go rośliny w kosmosie', 'Przywozi go tylko rakietą'], f: 'To się nazywa elektroliza wody.' },
      { q: 'Co dzieje się na stacji ze zużytą wodą, np. z potu?', a: 'Jest oczyszczana i pita ponownie', w: ['Wyrzucana w kosmos', 'Zamrażana na pamiątkę', 'Zamieniana w prąd'], f: 'Stacja odzyskuje większość wody. Nic się nie marnuje!' },
      { q: 'Jak nazywa się system, który dba o powietrze i wodę na stacji?', a: 'ECLSS (podtrzymywanie życia)', w: ['GPS (nawigacja)', 'LEGO (klocki)', 'Wi-Fi (internet)'], f: 'ECLSS to skrót od: Environmental Control and Life Support System.' },
      { q: 'Co może zrobić duży rozbłysk na Słońcu?', a: 'Zakłócić łączność i satelity', w: ['Zatrzymać Księżyc', 'Zamrozić Słońce', 'Zgasić gwiazdy'], f: 'NASA śledzi rozbłyski w bazie DONKI. W grze też możesz je sprawdzić! ☀️' },
      { q: 'Ile razy dziennie ISS okrąża Ziemię?', a: 'Około 16 razy', w: ['Raz na miesiąc', 'Raz dziennie', 'Raz na rok'], f: 'Jeden obieg trwa około 90 minut, więc astronauci widzą wiele wschodów Słońca dziennie!' },
    ],
    hard: [
      { q: 'Skąd bierze się energia Słońca?', a: 'Z łączenia się atomów wodoru w hel', w: ['Ze spalania węgla', 'Z wielkiego komina', 'Z magnesu w środku'], f: 'To się nazywa synteza jądrowa.' },
      { q: 'Ile mniej więcej trwa lot światła ze Słońca na Ziemię?', a: 'Około 8 minut', w: ['Około 8 sekund', 'Około 8 godzin', 'Natychmiast'], f: 'Widzimy Słońce takie, jakie było 8 minut temu.' },
      { q: 'Jak nazywa się wyrzut chmury naładowanych cząstek ze Słońca?', a: 'Koronalny wyrzut masy (CME)', w: ['Zaćmienie Słońca', 'Kometa', 'Meteoryt'], f: 'CME może wywołać zorze polarne i zakłócić satelity.' },
      { q: 'Jak oznacza się najsilniejsze rozbłyski słoneczne?', a: 'Klasą X', w: ['Klasą A', 'Klasą Z', 'Klasą K'], f: 'Skala to A, B, C, M, X. Każda klasa jest 10 razy silniejsza od poprzedniej.' },
      { q: 'Co robi atmosfera Ziemi z większością promieniowania z kosmosu?', a: 'Pochłania je i osłabia', w: ['Wzmacnia je', 'Zamienia w tlen', 'Nic z nim nie robi'], f: 'Poza atmosferą astronauci dostają więcej promieniowania.' },
      { q: 'Co chroni Ziemię przed wiatrem słonecznym?', a: 'Pole magnetyczne Ziemi', w: ['Księżyc', 'Chmury', 'Pas asteroid'], f: 'Dlatego zorze widać blisko biegunów, gdzie pole kieruje cząstki w dół.' },
    ] } },
  { id: 3, title: 'MeowMission 3: Mars i Ziemia', icon: '🪐', color: '#FFD3DE', topic: '🔭', qs: {
    easy: [
      { q: 'Jaki kolor ma Mars?', a: 'Czerwony', w: ['Zielony', 'Różowy', 'Fioletowy'] },
      { q: 'Jak nazywa się dom na Marsie?', a: 'Kolonia', w: ['Zoo', 'Sklep', 'Basen'] },
      { q: 'Gdzie rosną rośliny w bazie?', a: 'W szklarni', w: ['W basenie', 'W garażu', 'W kinie'] },
      { q: 'Jaka planeta to nasz dom?', a: 'Ziemia', w: ['Mars', 'Słońce', 'Księżyc'] },
      { q: 'Co jest najbliżej Ziemi?', a: 'Księżyc', w: ['Kometa', 'Ufo', 'Meteor'] },
      { q: 'Jaki kształt ma Ziemia?', a: 'Kula', w: ['Kostka', 'Trójkąt', 'Piramida'] },
    ],
    mid: [
      { q: 'Ile mniej więcej trwa lot na Marsa?', a: 'Około 7 miesięcy', w: ['Kilka godzin', 'Około 3 dni', 'Około 20 lat'], f: 'Okno startowe na Marsa otwiera się mniej więcej co 26 miesięcy.' },
      { q: 'Dlaczego Mars jest czerwony?', a: 'Ma dużo rdzy w gruncie', w: ['Pokrywa go czerwona farba', 'Cały jest z lawy', 'Odbija światło Ziemi'], f: 'Rdza to tlenek żelaza, ten sam, co na starym rowerze.' },
      { q: 'Który łazik NASA jeździ po Marsie?', a: 'Perseverance', w: ['Hubble', 'Voyager', 'Apollo'], f: 'Perseverance szuka śladów dawnego życia i zbiera próbki skał.' },
      { q: 'Ile trwa wiadomość radiowa z Marsa na Ziemię?', a: 'Od kilku do kilkunastu minut', w: ['Ułamek sekundy', 'Kilka dni', 'Natychmiast, bez opóźnienia'], f: 'Dlatego łaziki muszą same podejmować część decyzji.' },
      { q: 'Dlaczego na Marsie ważyłbyś mniej niż na Ziemi?', a: 'Mars ma słabszą grawitację', w: ['Mars jest bliżej Słońca', 'Na Marsie nie ma powietrza', 'Mars kręci się szybciej'], f: 'Na Marsie ważyłbyś mniej więcej 38% tego, co na Ziemi.' },
      { q: 'Które planety są bliżej Słońca niż Ziemia?', a: 'Merkury i Wenus', w: ['Mars i Jowisz', 'Saturn i Uran', 'Neptun i Pluton'], f: 'Ziemia jest trzecią planetą od Słońca.' },
    ],
    hard: [
      { q: 'Ile trwa jedna doba (sol) na Marsie?', a: 'Około 24 godzin i 40 minut', w: ['Około 12 godzin', 'Około 48 godzin', 'Dokładnie 30 dni'], f: 'Doba marsjańska nazywa się „sol”.' },
      { q: 'Z czego głównie składa się atmosfera Marsa?', a: 'Z dwutlenku węgla', w: ['Z tlenu', 'Z pary wodnej', 'Z wodoru'], f: 'Jest bardzo rzadka, więc ludzie nie mogliby nią oddychać.' },
      { q: 'Jak nazywa się największy wulkan Układu Słonecznego, leżący na Marsie?', a: 'Olympus Mons', w: ['Mount Everest', 'Etna', 'Wezuwiusz'], f: 'Ma około 22 km wysokości, prawie 2,5 razy więcej niż Mount Everest.' },
      { q: 'Jak nazywają się dwa księżyce Marsa?', a: 'Fobos i Deimos', w: ['Io i Europa', 'Tytan i Enceladus', 'Ganimedes i Kallisto'], f: 'To małe, nieregularne księżyce, trochę jak ziemniaki.' },
      { q: 'Co zrobił mały helikopter NASA na Marsie?', a: 'Wykonał pierwsze loty sterowane na innej planecie', w: ['Przywiózł astronautów', 'Zbudował bazę', 'Zrobił selfie z kosmitą'], f: 'Nazywał się Ingenuity i wykonał dziesiątki lotów.' },
      { q: 'Co to jest okno startowe na Marsa?', a: 'Czas, gdy Ziemia i Mars są ustawione korzystnie do lotu', w: ['Okno w statku kosmicznym', 'Godzina startu w ciągu dnia', 'Przerwa w łączności'], f: 'Takie okno pojawia się mniej więcej co 26 miesięcy.' },
    ] } },
  { id: 4, title: 'MeowMission 4: Księżyc', icon: '🌙', color: '#E8E4FF', topic: '🌙', qs: {
    easy: [
      { q: 'Co krąży wokół Ziemi?', a: 'Księżyc', w: ['Słońce', 'Mars', 'Jowisz'] },
      { q: 'Jaki kształt ma Księżyc?', a: 'Kuli', w: ['Sześcianu', 'Piramidy', 'Gwiazdy'] },
      { q: 'Kto jako pierwszy stanął na Księżycu?', a: 'Neil Armstrong', w: ['Jurij Gagarin', 'Albert Einstein', 'Święty Mikołaj'], f: 'Zrobił to w 1969 roku.' },
      { q: 'Co jest na powierzchni Księżyca?', a: 'Kratery i pył', w: ['Drzewa', 'Domy', 'Rzeki'] },
      { q: 'Ile księżyców ma Ziemia?', a: 'Jeden', w: ['Dwa', 'Trzy', 'Zero'] },
      { q: 'Z czego głównie jest powierzchnia Księżyca?', a: 'Ze skał i kurzu', w: ['Z sera', 'Z waty cukrowej', 'Z wody'], f: 'Ser to tylko bajka!' },
    ],
    mid: [
      { q: 'W którym roku człowiek pierwszy raz wylądował na Księżycu?', a: '1969', w: ['1869', '1989', '2009'] },
      { q: 'Jak nazywała się misja, która zawiozła Armstronga na Księżyc?', a: 'Apollo 11', w: ['Sputnik 1', 'Voyager 2', 'Hubble'] },
      { q: 'Co powoduje fazy Księżyca?', a: 'Widzimy jego oświetloną część pod różnymi kątami', w: ['Cień Ziemi co dzień go zakrywa', 'Księżyc zmienia rozmiar', 'Chmury go zasłaniają'], f: 'Księżyc sam nie świeci, odbija światło Słońca.' },
      { q: 'Dlaczego zawsze widzimy ten sam bok Księżyca?', a: 'Obraca się raz w czasie jednego okrążenia Ziemi', w: ['Nie obraca się wcale', 'Jest przyklejony do Ziemi', 'Drugi bok jest ciemny'], f: 'Drugi bok istnieje i też jest oświetlany przez Słońce.' },
      { q: 'Ile mniej więcej trwa jedno okrążenie Ziemi przez Księżyc?', a: 'Około 27 dni', w: ['1 dzień', 'Tydzień', 'Rok'] },
      { q: 'Jak nazywa się program NASA, który ma wrócić na Księżyc?', a: 'Artemis', w: ['Apollo', 'Voyager', 'Gemini'], f: 'W mitologii Artemida to siostra bliźniaczka Apolla.' },
    ],
    hard: [
      { q: 'Ile razy słabsza jest grawitacja na Księżycu niż na Ziemi?', a: 'Około 6 razy', w: ['Około 2 razy', 'Około 20 razy', 'Jest taka sama'], f: 'Dlatego astronauci robili tam wielkie skoki.' },
      { q: 'Co głównie powoduje przypływy i odpływy mórz?', a: 'Przyciąganie Księżyca', w: ['Wiatr z gór', 'Zimne prądy z biegunów', 'Burze na Słońcu'] },
      { q: 'Czym jest regolit?', a: 'Warstwą pyłu i odłamków skał na Księżycu', w: ['Paliwem rakietowym', 'Księżycowym oceanem', 'Rośliną z Marsa'] },
      { q: 'Ile mniej więcej trwał lot Apollo na Księżyc?', a: 'Około 3 dni', w: ['Około 3 godzin', 'Około 3 tygodni', 'Około 3 miesięcy'] },
      { q: 'Co dzieje się podczas zaćmienia Słońca?', a: 'Księżyc przechodzi między Ziemią a Słońcem', w: ['Słońce na chwilę gaśnie', 'Mars zasłania Słońce', 'Ziemia chowa się w cieniu'] },
      { q: 'Jak daleko jest Księżyc od Ziemi?', a: 'Około 384 tysięcy km', w: ['Około 38 tysięcy km', 'Około 3,8 miliona km', 'Około 384 miliony km'] },
    ] } },
  { id: 5, title: 'MeowMission 5: Planety', icon: '🪐', color: '#FFE8CF', topic: '🪐', qs: {
    easy: [
      { q: 'Ile planet ma Układ Słoneczny?', a: 'Osiem', w: ['Dwanaście', 'Pięć', 'Trzy'] },
      { q: 'Wokół czego krążą planety?', a: 'Wokół Słońca', w: ['Wokół Księżyca', 'Wokół Ziemi', 'Wokół komety'] },
      { q: 'Która planeta jest największa?', a: 'Jowisz', w: ['Ziemia', 'Mars', 'Merkury'] },
      { q: 'Którą planetę nazywamy Czerwoną Planetą?', a: 'Mars', w: ['Wenus', 'Uran', 'Neptun'] },
      { q: 'Którą planetę otaczają duże, widoczne pierścienie?', a: 'Saturn', w: ['Mars', 'Merkury', 'Wenus'] },
      { q: 'Na której planecie mieszkamy?', a: 'Na Ziemi', w: ['Na Marsie', 'Na Wenus', 'Na Jowiszu'] },
    ],
    mid: [
      { q: 'Która planeta jest najbliżej Słońca?', a: 'Merkury', w: ['Wenus', 'Ziemia', 'Mars'] },
      { q: 'Która planeta jest najgorętsza?', a: 'Wenus', w: ['Merkury', 'Mars', 'Jowisz'], f: 'Jej gęsta atmosfera zatrzymuje ciepło, jest tam ponad 450°C.' },
      { q: 'Która planeta jest najdalej od Słońca?', a: 'Neptun', w: ['Uran', 'Saturn', 'Jowisz'] },
      { q: 'Jak nazywa się planeta karłowata za Neptunem?', a: 'Pluton', w: ['Tytan', 'Io', 'Europa'] },
      { q: 'Które planety nazywamy skalistymi?', a: 'Merkury, Wenus, Ziemię i Marsa', w: ['Jowisza i Saturna', 'Urana i Neptuna', 'Wszystkie planety'] },
      { q: 'Ile mniej więcej trwa rok na Ziemi?', a: 'Około 365 dni', w: ['Około 30 dni', 'Około 100 dni', 'Około 1000 dni'] },
    ],
    hard: [
      { q: 'Który księżyc Jowisza jest największy w Układzie Słonecznym?', a: 'Ganimedes', w: ['Io', 'Europa', 'Tytan'] },
      { q: 'Który księżyc Saturna ma gęstą atmosferę?', a: 'Tytan', w: ['Enceladus', 'Ganimedes', 'Fobos'] },
      { q: 'Z czego głównie składa się Jowisz?', a: 'Z wodoru i helu', w: ['Ze skał i żelaza', 'Z lodu i wody', 'Z tlenu i azotu'] },
      { q: 'Czym jest Wielka Czerwona Plama na Jowiszu?', a: 'Ogromną burzą trwającą od setek lat', w: ['Wulkanem', 'Kraterem', 'Jeziorem lawy'] },
      { q: 'Która planeta obraca się jakby leżała na boku?', a: 'Uran', w: ['Mars', 'Wenus', 'Merkury'] },
      { q: 'Jak długo trwa rok na Marsie?', a: 'Prawie 2 ziemskie lata', w: ['Dokładnie rok', 'Pół roku', 'Około 12 lat'] },
    ] } },
  { id: 6, title: 'MeowMission 6: Rakiety', icon: '🚀', color: '#D2EFFF', topic: '🚀', qs: {
    easy: [
      { q: 'Co wydobywa się z rakiety przy starcie?', a: 'Ogień i gaz', w: ['Woda', 'Konfetti', 'Śnieg'] },
      { q: 'Jak odliczamy czas przed startem rakiety?', a: 'Wstecz: 3, 2, 1...', w: ['Do przodu: 1, 2, 3...', 'Śpiewamy piosenkę', 'Nie odliczamy'] },
      { q: 'Co rakieta wynosi w kosmos?', a: 'Satelity i astronautów', w: ['Samochody', 'Domy', 'Drzewa'] },
      { q: 'Jak nazywa się miejsce, z którego startują rakiety?', a: 'Kosmodrom', w: ['Zoo', 'Port rybacki', 'Boisko'] },
      { q: 'Czym leci w kosmos astronauta?', a: 'Rakietą', w: ['Rowerem', 'Łódką', 'Hulajnogą'] },
      { q: 'Dokąd lecą rakiety?', a: 'W kosmos', w: ['Pod wodę', 'Do piwnicy', 'Do lasu'] },
    ],
    mid: [
      { q: 'Po co rakiecie paliwo?', a: 'Spala się i pcha rakietę w górę', w: ['Żeby ładnie świeciła', 'Żeby była cięższa', 'Żeby grzało w kabinie'] },
      { q: 'Dlaczego rakieta ma kilka stopni?', a: 'Puste zbiorniki odpadają i rakieta robi się lżejsza', w: ['Żeby ładnie wyglądała', 'Żeby było więcej pasażerów', 'Żeby szybciej się grzała'] },
      { q: 'Jak nazywał się pierwszy sztuczny satelita Ziemi?', a: 'Sputnik 1', w: ['Apollo 11', 'Voyager 1', 'Hubble'], f: 'Poleciał w 1957 roku.' },
      { q: 'Kto jako pierwszy człowiek poleciał w kosmos?', a: 'Jurij Gagarin', w: ['Neil Armstrong', 'Buzz Aldrin', 'John Glenn'], f: 'Było to w 1961 roku.' },
      { q: 'Jaka zasada fizyki napędza rakietę?', a: 'Akcja i reakcja', w: ['Magnetyzm', 'Tarcie', 'Pływanie'], f: 'Gaz leci w dół, a rakieta w górę.' },
      { q: 'Dlaczego rakiety często startują blisko równika?', a: 'Obrót Ziemi daje im dodatkową prędkość', w: ['Tam jest zawsze zimno', 'Tam nie ma chmur', 'Tam nie ma grawitacji'] },
    ],
    hard: [
      { q: 'Jak szybko trzeba lecieć, żeby wejść na niską orbitę Ziemi?', a: 'Około 7,8 km/s', w: ['Około 78 km/h', 'Około 0,78 km/s', 'Około 780 km/s'] },
      { q: 'Czym jest orbita?', a: 'Drogą jednego ciała wokół drugiego', w: ['Rodzajem paliwa', 'Częścią rakiety', 'Miejscem startu'] },
      { q: 'Jak nazywamy uczucie ciężaru podczas przyspieszania rakiety?', a: 'Przeciążenie', w: ['Nieważkość', 'Efekt cieplarniany', 'Kosmiczne ciśnienie'] },
      { q: 'Dlaczego kapsuła wracająca na Ziemię ma osłonę termiczną?', a: 'Tarcie o atmosferę bardzo ją rozgrzewa', w: ['Chroni przed zimnem kosmosu', 'Żeby świeciła w nocy', 'Dla ozdoby'] },
      { q: 'Co potrafią rakiety wielokrotnego użytku?', a: 'Pierwszy stopień wraca i może polecieć ponownie', w: ['Latają bez paliwa', 'Zamieniają się w satelity', 'Wracają do magazynu na kołach'] },
      { q: 'Jaka rakieta wyniosła astronautów Apollo na Księżyc?', a: 'Saturn V', w: ['Falcon 9', 'Ariane 5', 'Vega'] },
    ] } },
];
const LETTERS = ['A', 'B', 'C', 'D'];
function pickQs(m, d) {
  const pool = m.qs[d];
  let seen = P.seen[d] || [];
  if (pool.every(q => seen.includes(q.q))) { P.seen[d] = seen = seen.filter(t => !pool.some(q => q.q === t)); }
  const fresh = shuffle(pool.filter(q => !seen.includes(q.q))), old = shuffle(pool.filter(q => seen.includes(q.q)));
  return [...fresh, ...old].slice(0, 5).map(q => ({
    q: q.q, f: q.f || '', topic: m.topic,
    opts: shuffle([{ t: q.a, ok: true }, ...q.w.map(t => ({ t, ok: false }))]),
  }));
}
