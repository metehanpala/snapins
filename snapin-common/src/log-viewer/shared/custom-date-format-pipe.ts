import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'dateFormatPipe',
  standalone: false
})
export class DateFormatPipe implements PipeTransform {
  public transform(value: string, userLang: string, format: string): string {
    if (format == 'timeFormat') {
      return new Date(value).toLocaleTimeString(userLang);
    } else if (format == 'dateFormat') {
      return new Date(value).toLocaleDateString(userLang);
    } else {
      return new Date(value).toLocaleString(userLang).replace(',', ',\n');
    }
  }
}
