<?php

namespace Parse\AdminPanel\Crud\Crud;

/**
 * Framework-neutral marker for a CRUD resource declaration.
 *
 * Laravel persistence, authorization, validation, and query behavior live in
 * the Infrastructure Eloquent adapter. Concrete panel resources inherit that
 * adapter through AdminPanelResource.
 */
abstract class CrudResource
{
    abstract public static function routeName(): string;

    abstract public static function title(): string;

    abstract public static function singularLabel(): string;

    /**
     * @return list<array<string, mixed>>
     */
    abstract public static function columns(): array;

    /**
     * @return list<array<string, mixed>>
     */
    abstract public static function fields(): array;
}
