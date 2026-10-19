```
$ cat README.md

__     ______  _  __
\ \   / /  _ \| |/ /
 \ \ / /| | | | ' /
  \ V / | |_| | . \
   \_/  |____/|_|\_\

Västerlösa Datorklubb · en datorklubb för hela byn
```

# Västerlösa Datorklubb

Hemsidan för Västerlösa Datorklubb, och klubbens allra första projekt. Vanlig HTML, CSS och lite JavaScript. Inga ramverk, inget byggsteg, inga beroenden.

## Kör sajten på din dator

```
$ git clone https://github.com/vasterlosa-datorklubb/vdk-hemsida.git
$ cd vdk-hemsida
$ python3 -m http.server
```

Öppna sedan http://localhost:8000 i webbläsaren.

Du kan också öppna `index.html` direkt, men då syns inte nedräkningen till nästa träff. Webbläsare tillåter nämligen inte att en sida hämtar andra filer från disken.

## Filerna

| Fil | Vad den gör |
| --- | --- |
| `index.html` | Startsidan, med nedräkning till nästa träff |
| `schema.html` | Schemat för 2027 |
| `delta.html` | Så är du med, skriven som en man-sida |
| `projekt.html` | Det klubben bygger |
| `sponsorer.html` | Sponsorer och hur man blir en |
| `404.html` | Visas när en sida inte finns |
| `style.css` | Allt utseende: fosforgrön terminal |
| `main.js` | Nedräkning, kalenderfil och ett och annat påskägg |

## Ändra schemat

Allt schema finns i tabellerna i `schema.html`. Nedräkningen på startsidan och kalenderfilen (.ics) läser datumen direkt därifrån, så schemat behöver bara skrivas på ett ställe.

Varje rad ser ut så här:

```html
<tr><td>5</td><td><time datetime="2027-02-04">tor 4 feb</time></td><td>Vad finns i en dator? Vi skruvar isär</td><td>Skruva isär</td></tr>
```

Det viktiga är `datetime="ÅÅÅÅ-MM-DD"`. Tiden som gäller för alla träffar står överst på sidan. Har en träff en annan tid skriver du den efter datumet, till exempel `<time datetime="2027-11-05">fre 5 nov</time> 18.00–23.00`.

## Bidra

1. Gör en fork av repot, eller en egen gren om du är med i organisationen.
2. Gör din ändring och kolla att sajten ser rätt ut på din dator.
3. Skicka en pull request.

Hittat en bugg men vet inte hur du fixar den? Öppna ett issue, eller berätta på nästa träff.

## Publicering

Sajten består bara av statiska filer. Inget behöver byggas, det är bara att lägga upp filerna på webbservern som de är.

## Flaggjakt

Det finns fyra flaggor på formatet `VDK{...}` gömda på sajten. Här får du inga ledtrådar, men du står redan i källkoden. Det är en bra början.
