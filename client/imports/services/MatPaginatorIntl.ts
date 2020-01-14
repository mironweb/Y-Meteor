import {MatPaginatorIntl} from '@angular/material';
export class MatPaginatorIntlCro extends MatPaginatorIntl {
  itemsPerPageLabel = 'Items per page';
  // nextPageLabel     = 'Slijedeća stranica';
  // previousPageLabel = 'Prethodna stranica';
  // firstPageLabel: "first";

  // getRangeLabel = function (page, pageSize, length) {
  //   if (length === 0 || pageSize === 0) {
  //     return '0 od ' + length;
  //   }
  //   length = Math.max(length, 0);
  //   const startIndex = page * pageSize;
  //   // If the start index exceeds the list length, do not try and fix the end index to the end.
  //   const endIndex = startIndex < length ?
  //     Math.min(startIndex + pageSize, length) :
  //     startIndex + pageSize;
  //   // return startIndex + 1 + ' - ' + endIndex + ' od ' + length;
  //   let result = `${startIndex + 1} - ${endIndex + 1} of ${length}`;
  //   return length == 500 ? result + " +" : result;
  // };
}
