import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'src/service/auth.service';
@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {
  feedbackForm: FormGroup;
  formmsg:any;
  submitted = false;
  constructor(private formBuilder: FormBuilder, private router: Router,private authservice:AuthService,public snackbar:MatSnackBar) {
    this.feedbackForm = this.formBuilder.group({
      msg: ['', [Validators.required]],
      subject: ['', Validators.required],
      name: ['', [Validators.required,Validators.pattern('^[a-zA-Z \-\']+'),Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]]
    });
  }

  ngOnInit(): void {

    var user = localStorage.getItem('user')
    var token = localStorage.getItem('token')

    if (user && token) {
      this.router.navigateByUrl('/dashboard')
      return

    }
  }

  get subject():any{    return this.feedbackForm.get('subject')  }
  get name():any{    return this.feedbackForm.get('name')  }
  get email():any{    return this.feedbackForm.get('email')  }
  get msg():any{    return this.feedbackForm.get('msg')  }
  // createForm() {
    

  //   /*both will work for set value manually*/
  //   //this.feedbackForm.get('category').setValue(this.selectedCat);
  //   // this.feedbackForm.controls["category"].setValue(this.selectedCat);
  // }

  sendFeedback() {
    debugger;
    console.log(this.subject)
    this.submitted = true;
    // stop here if form is invalid
    if (this.feedbackForm.invalid) {
      return;
    }
    else {
      this.formmsg = 'Your feedback is submitted successfully';
      console.log(this.feedbackForm.value);
      var data = {'name':this.name.value,'email':this.email.value,'subject':this.subject.value,'msg':this.msg.value}
      this.authservice.contactus(data).subscribe(res=>{console.log(res);this.snackbar.open('Your feedback is submitted successfully','OK',{duration:5000})},error=>{console.log(error)})
      this.feedbackForm.reset()
    }

  }

}
