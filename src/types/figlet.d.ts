// declare var figlet : (s:string, {}, act:(e:string, a:string) => void) => void;
declare var figlet: any;

declare module 'figlet' {
  export = figlet;
}
