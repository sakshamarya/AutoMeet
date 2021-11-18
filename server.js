// For heroku deployment, refered https://dev.to/waqasabbasi/optimizing-and-deploying-puppeteer-web-scraper-1nll
const puppeteer = require('puppeteer-extra');
const express = require('express');
const app = express();
const bodyParser = require('body-parser'); // used body parser since the data that is sent directly from post method of form is not parsed by default. The data is sent along with the body, that is why we use res.body.abcd..
const { response } = require('express');
const alert = require('alert');

// stealth plugin -> when we run browser in headless mode, browser choose to serve different content on the webpageor no content at all. So, we use stealth plugin so that browser can run the same way it does in non headless mode.
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html');
});

const ip = process.env.IP || '0.0.0.0'; // For heroku deployment
const PORT = process.env.PORT || 5000;

app.listen(PORT,ip,()=>{
    console.log('server is listening on port 3000');
});

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
  }));

app.post('/clientData', (req,res)=>{
    let emailId = req.body.email;
    let password = req.body.password;
    let meetLink = req.body.meetLink;
    let joinTime = req.body.joinTime;
    let time = req.body.time;
    let triggerText = req.body.triggerText;
    let sendText = req.body.sendText;


    time = parseInt(time * 60 * 60 * 1000);

    console.log(emailId, meetLink, time);

    try {
        (async () => {

            const browser = await puppeteer.launch({
            //   headless: false, // If we run this in default i.e. headless: true, the browser will open in the background
              args: [ '--use-fake-ui-for-media-stream' , '--no-sandbox'],  //allows the user to skip a prompt of getUserMedia
            });
            const page = await browser.newPage();
    
            await page.waitForTimeout(time);
    
            await page.goto('https://accounts.google.co.in');
          
            await page.type('#identifierId', emailId, { delay: 10 }); // Entering email id, delay for slow typing
            
          
            //we have to click and also we have to wait until the new page is loaded
          
            try {
                await Promise.all([
                    await page.click('.VfPpkd-LgbsSe', {clickCount: 1}),
                    page.waitForNavigation({waitUntil: 'networkidle0'}),
            
                    // delay for extra 3 seconds so that it gets the time to switch to next page
                    await page.waitForTimeout(3000)
                ]);
            } catch (error) {
                console.log('invalid Email');
                alert('Invalid Email!')
                await browser.close();
                res.sendFile(__dirname + '/index.html');
                return;
            }
          
            await page.type('.whsOnd', password, {delay: 10});
          
          
               //Clicking next button
              try {
                await Promise.all([
                    await page.click('.VfPpkd-LgbsSe', {clickCount: 1}),
                    page.waitForNavigation({waitUntil: 'networkidle0'}),
            
                    // delay for extra 3 seconds so that it gets the time to switch to next page
                    await page.waitForTimeout(3000)
                ]);
              } catch (error) {
                  console.log('Invalid Password');
                  alert('Invalid Password');
                  await browser.close();
                  res.sendFile(__dirname + '/index.html');
                  return;
              }
          
              
            //Now, we are logged in, Go to google meet link
              
            try {
                await page.goto(meetLink);
            } catch (error) {
                // Invalid meet link
                alert('Invalid Meet Link');
                await browser.close();
                res.sendFile(__dirname + '/index.html');
                return;
            }
    
    
            var isLinkActive = false;
    
            while(isLinkActive == false)
            {
                // Go to meet Link
                await page.goto(meetLink);
    
                // wait to load audio and video
                await page.waitForTimeout(3000);
            
                // Turning off audio by ctr+d shortcut and video by ctr+e shortcut
                await page.keyboard.down('Control');
                await page.keyboard.press('d');
                await page.keyboard.up('Control');
            
                await page.keyboard.down('Control');
                await page.keyboard.press('e');
                await page.keyboard.up('Control');
            
                try {
                    
                    // Clicking join button
                    await Promise.all([
                        await page.click('.Y5sE8d', {clickCount: 1}),
                        // delay for extra 3 seconds so that it gets the time to switch to next page
                        // alert('Meet Joined Successfully'),
                        // await page.waitForTimeout(3000),
                        isLinkActive = true
                    ]);
    
                } catch (error) {
                    // This means that the meet link is Inactive since we cant find join button, wait for 1 minute, then try to join again.
                    console.log('meet is not active yet');
                    await page.waitForTimeout(5000);
                }
    
                if(isLinkActive == true)
                {
                    break;
                }
            }
    
                // Wait for 5 seconds to load page
                await page.waitForTimeout(5000);
    
                // to turn on captions
                await page.keyboard.press('c');
    
    
                // Open comment field - ctrl + alt + c
                await page.keyboard.down('Control');
                await page.keyboard.down('AltLeft');
                await page.keyboard.press('c');
                await page.keyboard.up('AltLeft');
                await page.keyboard.up('Control');
    
                const endTime = Date.now() + (joinTime * 60 * 1000);
    
                let flag=0;
    
                while(Date.now() < endTime)
                {
                    if(flag==0)
                    {
                        try {
                            //   CNusmb -> span element containing caption texts
                            const element = await page.$$('.CNusmb');
                            
                            for(let i=0;i<element.length;i++)
                            {
                                const arrayElement = element[i];
                                const captionText = await page.evaluate(arrayElement=> arrayElement.textContent,arrayElement);
                                console.log(captionText);
    
                                // captionText == (triggerText+".")
    
                                if(captionText.includes(triggerText))
                                {
                                    console.log(typeof(captionText));
                                    flag=1; 
                                    
                                    // KHxj8b -> Enter text in comment box
                                    await page.type('.KHxj8b', sendText, {delay: 0});
                                    await page.keyboard.press('Enter');
                                }
                            }
        
                        } catch (error) {
                            console.log('caption not present on the screen');
                        }
                    }
    
                }
    
          
                // await page.waitForTimeout((joinTime * 60 * 1000));
    
                console.log('Ending Call');
    
                // Clicking red button to leave the call
                await Promise.all([
                    await page.click('.jh0Tpd', {clickCount: 1}),
                    console.log('Ended Meeting by pressing call button'),
            
                    // delay for extra 3 seconds so that it gets the time to switch to next page
                    await page.waitForTimeout(3000)
                ]);
            
                await page.waitForTimeout(3000);
                res.sendFile(__dirname + '/index.html')
            
                await browser.close();
          })();
    } catch (error) {
        console.log(error);
    }

    
      
      

    
});

