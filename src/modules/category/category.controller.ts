import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // POST /api/categories
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(user.id, dto);
  }

  // GET /api/categories — flat list for dropdowns
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.categoryService.findAllForUser(user.id);
  }

  // GET /api/categories/tree — nested parent/child tree
  @Get('tree')
  getTree(@CurrentUser() user: AuthUser) {
    return this.categoryService.getTree(user.id);
  }

  // GET /api/categories/:id
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoryService.findOneForUser(user.id, id);
  }

  // PATCH /api/categories/:id
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(user.id, id, dto);
  }

  // PATCH /api/categories/:id/deactivate — soft delete
  @Patch(':id/deactivate')
  deactivate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoryService.deactivateCategory(user.id, id);
  }

  // DELETE /api/categories/:id — hard delete
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.categoryService.removeCategory(user.id, id);
  }
}
