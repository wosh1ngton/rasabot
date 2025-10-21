import { startServer } from './app/server';


const main = async () => {

    const { messageService } = await startServer();    

    const userNumber = "556194182195";
   // const userNumber = "5561994182142";
    await messageService.initializeBot(userNumber);
}

main().catch(console.error);