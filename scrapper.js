const fs = require("fs");

const puppeteer = require("puppeteer");

async function scrapeProduct(url, mail, password, year, round) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url);

    //const browser = await puppeteer.launch({});

    //await page.type("#input",'text',{delay: 100});

    //await new Promise(resolve => setTimeout(resolve, 1000));

    //await page.screenshot({path:'bot.jpg', fullPage: true});

    //await page.pdf({path:'bot.pdf', format: 'A4'});

    //const html = await page.content();

    //const notes = await page.$$('.table table-bordered grid-table');
    //for(const note of notes){}

    //     for (let index = 1; index < 12; index++) {
    //     const [wl] = await page.$x('//*[@id="tab_notes_exam"]/div[1]/div/table/tbody/tr['+index+']/td[1]');
    //     const mat = await wl.getProperty('textContent');
    //     const subject = await mat.jsonValue();
    //     console.log({ subject });
    //     }

    //const text = await page.evaluate(()=>document.body.innerText);
    //console.log({ text });

    //const [el] = await page.$x('/html/body/div/div/div/div[2]/div/div/img');
    //const src = await el.getProperty('src');
    //const srcTxt = await src.jsonValue();

    //const notes = await page.evaluate(() => Array. from(document.querySelectorAll('a'), (e) => e.href));

    //await page.waitForNavigation();

    let loggedIn = false;
    while (!loggedIn) {
        await page.waitForSelector(".item");
        await page.click(".item");

        await page.waitForSelector("#UserName");
        await page.type("#UserName", mail, { delay: 50 }); //mail

        await page.waitForSelector(".item");
        await page.click(".item");

        await page.waitForSelector("#Password");
        await page.type("#Password", password, { delay: 50 }); //password

        await page.waitForSelector(".item");
        await page.click(".item");

        await page.click("#btnSubmit");

        await page.goto("https://waliye.men.gov.ma/moutamadris/General/Home");

        try {
            await Promise.race([
                page.waitForNavigation({ timeout: 5000 }),
                page.waitForSelector("#NoteDiv", { timeout: 5000 }),
            ]);
            loggedIn = true;
        } catch (error) {
            console.error("Login attempt failed. Retrying...");
        }
    }

    await page.goto(
        "https://waliye.men.gov.ma/moutamadris/TuteurEleves/GetNotesEleve"
    );

    await page.waitForSelector("#SelectedAnnee");

    await page.select("#SelectedAnnee", year); // year

    await page.waitForSelector("#SelectedSession");

    await page.select("#SelectedSession", round); //round

    await page.click("#btnSearchNotes");

    await page.waitForSelector("#tab_notes_exam");

    await page.waitForSelector(
        "#ResultBulletin > div > div > div.widgetCont > div.nav-tabs-custom > ul > li:nth-child(2) > a",
        { delay: 5000 }
    );

    await page.click(
        "#ResultBulletin > div > div > div.widgetCont > div.nav-tabs-custom > ul > li:nth-child(2) > a"
    );

    const collectedData = [];

    for (let index = 1; index < 20; index++) {
        try {
            const [wl] = await page.$x(
                '//*[@id="tab_notes_exam"]/div[1]/div/table/tbody/tr[' +
                index +
                "]/td[1]",
                { delay: 100 }
            );
            if (!wl) {
                continue;
            }

            const sub = await wl.getProperty("textContent");
            const subject = await sub.jsonValue();

            const [wll] = await page.$x(
                '//*[@id="tab_notes_exam"]/div[1]/div/table/tbody/tr[' +
                index +
                "]/td[2]",
                { delay: 100 }
            );
            if (!wll) {
                continue;
            }

            const gra = await wll.getProperty("textContent");
            const grade = await gra.jsonValue();

            collectedData.push({ subject, grade });
        } catch (error) {
            console.error(`Error at index ${index}`);
        }
    }

    for (let index = 1; index < 3; index++) {
        try {
            const [wl] = await page.$x(
                '//*[@id="tab_notes_exam"]/div[2]/div[' + index + "]/label",
                { delay: 100 }
            );

            const sub = await wl.getProperty("textContent");
            const subject = await sub.jsonValue();

            const [wll] = await page.$x(
                '//*[@id="tab_notes_exam"]/div[2]/div[' + index + "]/span",
                { delay: 100 }
            );

            const gra = await wll.getProperty("textContent");
            const grade = await gra.jsonValue();

            collectedData.push({ subject, grade });
        } catch (error) {
            console.error(`Error at index ${index}`);
        }
    }



    await new Promise((resolve) => setTimeout(resolve, 5000));

    await page.goto("https://waliye.men.gov.ma/moutamadris/Account/LogOff");

    browser.close();


    const jsonDataString = JSON.stringify(collectedData, null, 2);
    console.log(jsonDataString);


    const jsonData = collectedData.map(entry => `${entry.subject.replace(/\s/g, '-')}:${entry.grade.replace(',', '.')}`).join('/');
    

    const formFilePath = "form.html";
    fs.readFile(formFilePath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        const updatedData = data.replace(
            'data-tf-hidden="marks="',
            `data-tf-hidden="marks=${jsonData}"`
        );
    

        fs.writeFile(formFilePath, updatedData, "utf8", (writeErr) => {
            if (writeErr) {
                console.error(writeErr);
                return;
            }
            console.log("JSON data added to the form.html");
        });
    });
}









function rot13Encrypt(inputString) {
    var result = '';
    for (var i = 0; i < inputString.length; i++) {
      var charCode = inputString.charCodeAt(i);
  
      // Encrypt uppercase letters
      if (65 <= charCode && charCode <= 90) {
        result += String.fromCharCode(((charCode - 65 + 13) % 26) + 65);
      }
      // Encrypt lowercase letters
      else if (97 <= charCode && charCode <= 122) {
        result += String.fromCharCode(((charCode - 97 + 13) % 26) + 97);
      }
      // Keep non-alphabet characters unchanged
      else {
        result += inputString.charAt(i);
      }
    }
    return result;
  }
  
  // Function to decrypt a string encrypted with ROT13 cipher (same as encryption)
  function rot13Decrypt(encryptedString) {
    return rot13Encrypt(encryptedString);
  }
  
  // Test the encryption and decryption
  var originalString = "api";
  
  var encryptedString = rot13Encrypt(originalString);
  console.log("Encrypted String: " + encryptedString);
  
  var decryptedString = rot13Decrypt(encryptedString);
  console.log("Decrypted String: " + decryptedString);




// let mail = "R130001518@taalim.ma";
// let password = "130569Akram";
// let year = "2022";
// let round = "2";
// scrapeProduct(
//     "https://waliye.men.gov.ma/moutamadris/Account",
//     mail,
//     password,
//     year,
//     round
// );
