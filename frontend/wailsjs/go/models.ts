export namespace backend {
	
	export class UIArgs {
	    envPath: string;
	    csvPath: string;
	    csvContent: string;
	    sheetUrl: string;
	    templatePath: string;
	    templateHTML: string;
	    subject: string;
	    text: string;
	    attachments: string[];
	    cc: string;
	    bcc: string;
	    concurrency: number;
	    retryLimit: number;
	    batchSize: number;
	    filter: string;
	    dryRun: boolean;
	    showPreview: boolean;
	    previewPort: number;
	    to: string;
	    scheduleAt: string;
	    interval: string;
	    cron: string;
	    jobRetries: number;
	    jobBackoff: string;
	    schedulerDB: string;
	
	    static createFrom(source: any = {}) {
	        return new UIArgs(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.envPath = source["envPath"];
	        this.csvPath = source["csvPath"];
	        this.csvContent = source["csvContent"];
	        this.sheetUrl = source["sheetUrl"];
	        this.templatePath = source["templatePath"];
	        this.templateHTML = source["templateHTML"];
	        this.subject = source["subject"];
	        this.text = source["text"];
	        this.attachments = source["attachments"];
	        this.cc = source["cc"];
	        this.bcc = source["bcc"];
	        this.concurrency = source["concurrency"];
	        this.retryLimit = source["retryLimit"];
	        this.batchSize = source["batchSize"];
	        this.filter = source["filter"];
	        this.dryRun = source["dryRun"];
	        this.showPreview = source["showPreview"];
	        this.previewPort = source["previewPort"];
	        this.to = source["to"];
	        this.scheduleAt = source["scheduleAt"];
	        this.interval = source["interval"];
	        this.cron = source["cron"];
	        this.jobRetries = source["jobRetries"];
	        this.jobBackoff = source["jobBackoff"];
	        this.schedulerDB = source["schedulerDB"];
	    }
	}

}

