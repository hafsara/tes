import { Component } from '@angular/core';
import { FormService } from '../../services/form.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrl: './access-control.component.scss',
    providers: [MessageService]

})
export class AccessControlComponent {
  tokens: string[] = [];
  invalidTokens: Set<string> = new Set();

  constructor(private formService: FormService, private messageService: MessageService) {}

  onTokenAdd(event: any) {
    const newToken = event.value;
    this.validateToken(newToken);
  }

  onTokenRemove(event: any) {
    const token = event.value;
    this.invalidTokens.delete(token);
  }


  validateToken(token: string) {
    this.formService.validateToken(token).subscribe({
      next: (isValid) => {
        if (!isValid) {
          this.invalidTokens.add(token);
          this.messageService.add({ severity: 'error', summary: 'Invalid Token', detail: `Token ${token} is invalid.` });
        }
      },
      error: () => {
        this.invalidTokens.add(token);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to validate token ${token}.` });
      }
    });
  }

  submitTokens() {
    if (this.invalidTokens.size > 0) {
      this.messageService.add({ severity: 'error', summary: 'Invalid Tokens', detail: 'Please correct the invalid tokens.' });
    } else {
      // Redirect to dashboard or perform the desired action
    }
  }

}
