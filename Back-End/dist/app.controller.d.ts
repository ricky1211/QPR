import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getWelcome(): any;
    getStatus(): {
        status: string;
        service: string;
    };
}
