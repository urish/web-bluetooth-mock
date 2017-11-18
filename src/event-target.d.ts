declare module "event-target-shim" {
    export class EventTarget {
        public addEventListener(event: string, listener: (e: Event) => void): void;
        public removeEventListener(event: string, listener: (e: Event) => void): void;
        public dispatchEvent(event: Event): void;
    }
}
