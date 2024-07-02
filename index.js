import puppeteer from 'puppeteer';

class Grupo{
    constructor(profesor, ayudante,horario){
        this.profesor = profesor;
        this.ayudante = ayudante;
        this.horario = horario
        this.calidad = 0;
        this.recom = 0;
        this.dificultad = 0;
    }
}

const processData = (grupo) =>{
    let profesor = grupo[2]
    let ayudante = grupo[8]
    let horario = "Horario de lu,mi,vi: "+grupo[5]+" Horario de Ma y Ju: "+grupo[11];
    return new Grupo(profesor, ayudante, horario)
}

(async () => {
    // Launch the browser and open a new blank page
    
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: "/etc/profiles/per-user/andreco/bin/brave",
        args: ['--no-sandbox']
    });
    let page = await browser.newPage();

    browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
          const newPage = await target.page();
          page = newPage;
        }
      });

    // Navigate the page to a URL
    await page.goto('https://web.fciencias.unam.mx/docencia/horarios/20251/217/5');

    const cookies = [{
        'name': 'JSESSIONID',
        'value': '7C25DF9600338638F4C09F773AA226A5'
    }];
    await page.setCookie(...cookies);
    await page.goto('https://web.fciencias.unam.mx/docencia/horarios/20251/217/5');
    //
    const div = await page.$('#info-contenido')
    // Extracting a single element using a CSS selector
    const nombres = await div.$$eval("tbody", elements => {
        return elements.map(el => el.textContent);  // Retornar los hrefs de todos los enlaces
    });
    const grupos = nombres.map((element) => processData(element.split("\n")))
    await page.goto('https://www.misprofesores.com/escuelas/Facultad-de-Ciencias-UNAM_2842');
    for(let e of grupos){
        await page.locator('.navbar-form .form-control').fill(e.profesor);
        await page.keyboard.press('Enter');
        await page.waitForSelector('.gs-title')
        const handle = await page.$('.gs-title a');
        const url = await page.evaluate(anchor => anchor.getAttribute('href'), handle);
        await page.goto(url)
        await page.waitForSelector('.quality')
        let element = await page.$('.quality .grade')
        e.calidad = await page.evaluate(el => el.textContent, element)
        element = await page.$('.takeAgain .grade')
        e.recom = await page.evaluate(el => el.textContent.trim(), element)
        element = await page.$('.difficulty .grade')
        e.dificultad = await page.evaluate(el => el.textContent.trim(), element)
        console.log(JSON.stringify(e))
        await page.goto('https://www.misprofesores.com/escuelas/Facultad-de-Ciencias-UNAM_2842');
        await page.waitForSelector('.input-sm')
    }
    await browser.close();
    var jsonArray = JSON.stringify(grupos)
    console.log(jsonArray)
})();
