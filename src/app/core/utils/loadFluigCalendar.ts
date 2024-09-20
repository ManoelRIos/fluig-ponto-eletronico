declare const FLUIGC: any;

export default function loadFluigCalendar(elements: String[]) {
  elements.map((elem) => {
    FLUIGC?.calendar(elem);
  });
}
