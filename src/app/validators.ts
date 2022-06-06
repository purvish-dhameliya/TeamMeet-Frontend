import { AbstractControl, ValidationErrors } from '@angular/forms';
  
export class UsernameValidator {
    static cannotContainSpace(control: AbstractControl) : ValidationErrors | null {
        if(control.value!=null && (control.value as string).indexOf(' ') >= 0){
            return {cannotContainSpace: true}
        }
  
        return null;
    }
}

export function passvalidator(control: AbstractControl){
    if (control && (control.value !== null || control.value !== undefined)){
        const cnfpassvalue= control.value;

        const passcontrol = control.root.get('password');
        if(passcontrol){
            const passvalue = passcontrol.value;
            if(passvalue !== cnfpassvalue){
                return{ notmatched: true}
            }
        }
    }return null;
}
