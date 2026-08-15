import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CsrfGuard } from '../../auth/guards/csrf.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type {
  AdminCustomer,
  AdminCustomerPage,
  CustomerNote,
} from './admin-customer.types';
import { AdminCustomersService } from './admin-customers.service';
import { CreateCustomerNoteDto } from './dto/create-customer-note.dto';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { CustomerParamsDto } from './dto/customer-params.dto';

@Controller('admin/customers')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminCustomersController {
  constructor(private readonly customers: AdminCustomersService) {}

  @Get()
  list(@Query() query: CustomerListQueryDto): Promise<AdminCustomerPage> {
    return this.customers.list(query);
  }

  @Get(':customerId/export')
  export(@Param() params: CustomerParamsDto) {
    return this.customers.export(params.customerId);
  }

  @Get(':customerId')
  get(@Param() params: CustomerParamsDto): Promise<AdminCustomer> {
    return this.customers.get(params.customerId);
  }

  @Post(':customerId/notes')
  @UseGuards(CsrfGuard)
  addNote(
    @Param() params: CustomerParamsDto,
    @Body() body: CreateCustomerNoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CustomerNote> {
    return this.customers.addNote(params.customerId, body, actor);
  }
}
