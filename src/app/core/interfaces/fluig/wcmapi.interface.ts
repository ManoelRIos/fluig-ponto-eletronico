export interface FluigWCMAPI {
    tenantURI: string;
    pageCode: string;
    browserName: string;
    contextPath: string;
    isEditMode: string;
    organizationId: string;
    pageId: string;
    protectedContextPath: string;
    serverContextURL: string;
    serverURL: string;
    tenantCode: string;
    tenantPATH: string;
    tenantURL: string;
    timezone: string;
    uploadURL: string;
    user: string;
    userCode: string;
    userEmail: string;
    userId: string;
    userLogin: string;
    logoff(): void;
}
