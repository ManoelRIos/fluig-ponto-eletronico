declare const window: any;
class AppSettings {
    public static tenantURI: any = window?.WCMAPI?.tenantURI
    public static pageCode: any = window?.WCMAPI?.pageCode
    public static APP_BASE = (this.tenantURI && this.pageCode) ? this.tenantURI + '/' + this.pageCode : '/';
}
export { AppSettings as APP_BASE_URL };