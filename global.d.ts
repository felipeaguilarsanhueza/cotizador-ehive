// global.d.ts
declare module 'nodemailer';
declare module "d3-fetch" {
    export function csv(
      url: string,
      row?: (d: any, index: number, columns: string[]) => any
    ): Promise<any[]>;
  }
  