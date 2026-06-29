import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http';
import * as moment from 'moment'
const jar = new CookieJar();

axios.defaults.httpAgent = new HttpCookieAgent({
  cookies: { jar },
  keepAlive: true,
});
axios.defaults.httpsAgent = new HttpsCookieAgent({
  cookies: { jar },
  keepAlive: true,
  rejectUnauthorized: false, // disable CA checks
});
axios.defaults.headers.common = {
  'User-Agent': 'HTTPie/2.3.0',
  Accept: '*/*',
};
import { BaseCaseParamsInterface, DeliveryAddressTypeEnum, OrderEntity, sliceLogParams } from '@ubaytools/core';

export class SAPService {
  static instance: SAPService;
  private constructor() { }

  static getInstance(): SAPService {
    if (!SAPService.instance) {
      SAPService.instance = new SAPService();
    }
    return SAPService.instance;
  }

  static url = process.env.SAP_URL;

  async login(params: BaseCaseParamsInterface<{}>): Promise<any> {
    try {
      const { refId, client } = sliceLogParams(params);
      const body = {
        CompanyDB: process.env.SAP_COMPANY_DB,
        UserName: process.env.SAP_USERNAME,
        Password: process.env.SAP_PASSWORD,
      };
      console.log('Login attempt');
      const response = await axios.post(`${SAPService.url}/Login`, body);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getProductItem(params: BaseCaseParamsInterface<{ itemCode: string }>, tried: boolean = false): Promise<any> {
    const { refId, client } = sliceLogParams(params);
    try {
      const response = await axios.get(`${SAPService.url}/Items('${params.itemCode}')`);
      return response;
    } catch (error) {
      if (!tried && error?.response?.data?.error?.code == 301) {
        await this.login(params);
        return await this.getProductItem(params, true);
      }
      throw error;
    }
  }

  async getProductsWithItemCodes(
    params: BaseCaseParamsInterface<{ itemCodesParam: string }>,
    tried: boolean = false
  ) {
    try {
      console.log("params.itemCodes", params.itemCodesParam);

      // 1. First try WITHOUT Basic Auth (cookies should be used automatically)
      const username = process.env.SAP_USERNAME;
      const password = process.env.SAP_PASSWORD;

      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

      const response = await axios.get(`${SAPService.url}/GetItems?${params.itemCodesParam}`, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      });

      // 🔥 IMPORTANT:
      // This response will include Set-Cookie
      // Your cookie jar (http-cookie-agent) will store it automatically

      console.log("response", response.data);
      return response.data;

    } catch (error) {
      console.log("error", error?.response?.data?.error);

      const sapErrorCode = error?.response?.data?.error?.code;
      const status = error?.response?.status;

      // 2. If failed (no cookie / expired), retry WITH Basic Auth
      if (!tried && (sapErrorCode == 301 || status === 401)) {
        console.log("Retrying with Basic Auth...");

        const username = process.env.SAP_USERNAME;
        const password = process.env.SAP_PASSWORD;

        const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

        try {
          const response = await axios.get(`${SAPService.url}/GetItems?${params.itemCodesParam}`, {
            headers: {
              Authorization: `Basic ${basicAuth}`,
            },
          });

          // 🔥 IMPORTANT:
          // This response will include Set-Cookie
          // Your cookie jar (http-cookie-agent) will store it automatically

          console.log("response (after auth)", response.data);

          return response.data;

        } catch (authError) {
          console.log("auth retry failed", authError?.response?.data?.error);
          throw authError;
        }
      }

      throw error;
    }
  }

}
