import { Component, Inject } from "@angular/core";
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";

@Component({
    selector: 'app-dashboard',
    template: `
    <span  style="color:white;line-height:40px;">Your RoomId Is : {{data}}  <button mat-icon-button color="accent" style="float:right;" [cdkCopyToClipboard]="data" (click)="snackBarRef.dismiss()">
    <mat-icon>content_copy</mat-icon>
    </button>
    </span>
    `
  })

  export class CopyComponent{
      constructor( public snackBarRef: MatSnackBarRef<CopyComponent>,
        @Inject(MAT_SNACK_BAR_DATA) public data: any){}
    
  }