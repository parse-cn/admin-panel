# Parse Admin Panel

`parse/admin-panel` 是一个基于 Laravel 与 Inertia React 的多 Panel 后台平台，
内置 CRUD 与 UI 模块。

它负责提供：

- Panel 注册与请求解析
- 独立域名或路径前缀
- Session guard 与 Eloquent provider
- 登录、退出和访问控制
- Dashboard、普通页面和 CRUD Resource 路由
- 左侧导航
- Inertia 根模板、共享 props 和前端页面解析
- 多个业务 Panel 之间的认证、资源和页面隔离

业务包负责提供：

- 用户模型与数据库迁移
- Dashboard Controller
- CRUD Resource
- 非 CRUD Controller 和页面
- 业务中间件
- 多租户查询约束
- Panel 专属品牌和共享 props

## 安装

Composer 项目需要依赖该包：

```json
{
    "require": {
        "parse/admin-panel": "*"
    }
}
```

运行安装命令：

```bash
php artisan admin-panel:install
pnpm install
php artisan migrate
pnpm build
```

安装命令会：

- 发布 `config/admin-panel.php`
- 创建 `routes/admin.php`
- 补充前端依赖
- 注册 Admin Panel Vite 入口
- 注册 Inertia、React 和 Tailwind Vite 插件
- 补充 TypeScript source 路径
- 调用 `wayfinder:generate --with-form` 生成 Wayfinder 类型

如果安装器报告 `package.json`、Vite 配置或 TypeScript 配置无法自动修改，按警告手动补齐后再执行
`pnpm install` 和 `pnpm build`。安装命令不会创建或修改业务 Panel 配置。

默认 Panel 复用 Laravel 的 `App\Models\User` 和 `users` provider。

## 默认配置

```php
<?php

use App\Models\User;

return [
    'middleware' => [
        'web',
    ],
    'vite' => [
        'entry' => 'vendor/parse/admin-panel/resources/js/app.tsx',
    ],
    'panels' => [
        'admin_panel' => [
            'domain' => env('ADMIN_PANEL_DOMAIN'),
            'prefix' => env('ADMIN_PANEL_PREFIX', 'admin'),
            'route_name' => 'admin_panel',
            'app_shell' => 'default',
            'localization' => [
                'default' => 'en',
                'fallback' => 'en',
                'supported' => [
                    'en' => 'English',
                    'zh_CN' => '简体中文',
                ],
            ],
            'pagination' => [
                'per_page' => 10,
                'per_page_options' => [5, 10, 15, 25, 50],
            ],
            'auth' => [
                'guard' => 'admin_panel',
                'provider' => 'users',
                'model' => User::class,
            ],
        ],
    ],
];
```

常用配置：

| 配置 | 说明 |
| --- | --- |
| `domain` | Panel 域名；为空时使用当前应用域名 |
| `prefix` | Panel URL 前缀；为空时不增加前缀 |
| `route_name` | 所有 Panel 路由的名称前缀 |
| `middleware` | 在 Panel 通用中间件之前执行的业务中间件 |
| `login_component` | 登录页 Inertia component，默认 `login` |
| `shared_props` | 实现 `SharesPanelProps` 的业务共享 props 类 |
| `brand` | `name` 必填，`logo`、`favicon` 可选；用于 App Shell 和根模板 |
| `theme` | 安全的 CSS token map，例如 `primary`、`primary_foreground` |
| `app_shell` | `default` 或 `app-shell-2` |
| `localization.default` | Panel 默认语言，必须存在于 `localization.supported` |
| `localization.fallback` | Panel 回退语言 |
| `localization.supported` | `locale => label` 映射，至少包含一项 |
| `pagination.per_page` | CRUD 默认每页条数 |
| `pagination.per_page_options` | CRUD 可选每页条数 |
| `auth.guard` | Session guard 名称 |
| `auth.provider` | Eloquent provider 名称 |
| `auth.model` | 实现认证契约的 Eloquent 用户模型 |
| `auth.status` | 可选；登录时要求用户 `status` 等于该值 |

不要在通用 `config/admin-panel.php` 中写 Admin 或 Merchant 的业务模型。
每个业务包应维护自己的配置并注册自己的 Panel。

`domain` 和 `prefix` 可以同时配置。Panel 的请求必须同时匹配域名（如果配置）和路径前缀；如果多个 Panel
都能匹配当前请求，解析会失败并抛出异常，因此不同 Panel 的域名/前缀不能重叠。

## 在业务包中注册 Panel

业务包 ServiceProvider：

```php
<?php

namespace Acme\Backoffice;

use Illuminate\Support\ServiceProvider;
use LogicException;
use Parse\AdminPanel\AdminPanelManager;
use Parse\AdminPanel\Routing\AdminPanelRouteLoader;

final class BackofficeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../config/backoffice.php',
            'acme.backoffice',
        );

        config()->set('inertia.pages.paths', [
            ...config('inertia.pages.paths', []),
            __DIR__.'/../resources/js/admin-pages',
        ]);
    }

    public function boot(
        AdminPanelManager $panels,
        AdminPanelRouteLoader $routeLoader,
    ): void {
        $configuration = config('acme.backoffice');

        if (! is_array($configuration)) {
            throw new LogicException(
                'The acme.backoffice configuration must be an array.',
            );
        }

        $panels->register('backoffice', $configuration);
        $routeLoader->load(__DIR__.'/../routes/backoffice.php');
    }
}
```

业务配置：

```php
<?php

use Acme\Backoffice\Models\BackofficeUser;

return [
    'domain' => env('BACKOFFICE_DOMAIN'),
    'prefix' => env('BACKOFFICE_PREFIX'),
    'route_name' => 'backoffice',
    'auth' => [
        'guard' => 'backoffice',
        'provider' => 'backoffice_users',
        'model' => BackofficeUser::class,
        'status' => 'active',
    ],
];
```

Manager 会根据 Panel 配置注册对应的 Laravel guard 和 provider。

## Panel 路由文件

所有扩展在业务包自己的路由文件中声明：

```php
<?php

use Parse\AdminPanel\AdminPanel;

$panel = AdminPanel::panel('backoffice');
```

不要把 Resource 和业务页面注册放进 ServiceProvider。ServiceProvider 只负责：

- 合并配置
- 注册 Panel
- 加载 Panel 路由声明文件

## 自定义 Dashboard

```php
use Acme\Backoffice\Http\Controllers\DashboardController;

$panel->dashboard(DashboardController::class);
```

默认 Dashboard 地址为 Panel 根路径。

指定 Dashboard 地址：

```php
$panel->dashboard(DashboardController::class, 'dashboard');
```

此时：

- Panel 根路径重定向到 `dashboard`
- 路由名仍为 `backoffice.dashboard`

Controller：

```php
<?php

namespace Acme\Backoffice\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('backoffice/dashboard', [
            'overview' => [
                'users' => 10,
            ],
        ]);
    }
}
```

页面：

```text
packages/acme/backoffice/resources/js/admin-pages/backoffice/dashboard.tsx
```

## 注册普通页面

普通 GET 页面使用 `page()`：

```php
use Acme\Backoffice\Http\Controllers\ReportController;

$panel->page(
    uri: 'reports',
    name: 'reports',
    action: ReportController::class,
    navigation: [
        'label' => 'Reports',
        'icon' => 'bar-chart-line',
        'group' => 'Insights',
        'groupSort' => 20,
        'sort' => 10,
    ],
);
```

生成：

```text
GET /reports
route: backoffice.reports
```

页面会继承当前 Panel 的：

- 域名和前缀
- Session guard
- 登录保护
- Inertia middleware
- 共享 props
- 左侧导航 active 状态

不传 `navigation` 时只注册路由，不显示菜单：

```php
$panel->page(
    uri: 'internal-status',
    name: 'internal_status',
    action: InternalStatusController::class,
);
```

普通页面的业务授权仍应在 Controller、Form Request、Policy 或 Gate 中执行。

## 注册业务路由

非 GET 路由或一组业务路由使用 `routes()`：

```php
use Illuminate\Support\Facades\Route;
use Acme\Backoffice\Http\Controllers\ReportController;

$panel->routes(function (): void {
    Route::post('reports/export', [ReportController::class, 'export'])
        ->name('reports.export');
});
```

回调中的路由自动位于当前 Panel 的认证路由组内，并自动获得
`route_name` 前缀。

不要在回调中重复添加域名、prefix、`web` 或 Panel guard。

## 文件上传

每个 Panel 默认注册 `image` 上传用途，Resource 中 `type => 'image'` 的字段会自动使用该用途的上传地址。
业务包可以注册自己的用途：

```php
use Illuminate\Http\Request;

$panel->upload(
    purpose: 'customer-avatar',
    disk: 'public',
    directory: fn (Request $request): string => 'customer-avatars',
    rules: ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
);
```

`purpose` 必须是 kebab-case，`rules` 不能为空；同一个 Panel 中不能重复注册同一用途。上传接口为：

```text
POST {panel-prefix}/uploads/{purpose}
route: {route_name}.uploads.store
```

请求字段名固定为 `file`，成功返回 HTTP `201`：

```json
{
    "path": "customer-avatars/merchant-1/avatar.webp",
    "url": "https://example.test/storage/customer-avatars/merchant-1/avatar.webp"
}
```

目录回调接收当前 `Request`，适合按租户或用户返回目录。目录和授权仍由业务代码负责，不能只依赖前端隐藏上传控件。

## CRUD Widget 接口

除了标准 CRUD 页面，Panel 还为已注册 Resource 提供内嵌 Widget 接口：

```text
GET    crud/{resource}/data
POST   crud/{resource}
PUT    crud/{resource}/{record}
DELETE crud/{resource}/{record}
POST   crud/{resource}/bulk-actions
```

路由名分别为 `{route_name}.crud.widget.data`、`store`、`update`、`destroy`、`bulk`。前端无需拼接 URL，
共享的 `panel.crudWidgetUrl` 会提供带当前 Panel 域名和前缀的 data URL；Resource definition 返回的其他操作 URL
也应优先使用后端生成的 route。

## CRUD Resource

Resource 必须继承 `AdminPanelResource`：

```php
<?php

namespace Acme\Backoffice\Resources;

use Illuminate\Database\Eloquent\Builder;
use Parse\AdminPanel\Resources\AdminPanelResource;
use Acme\Core\Models\Customer;

final class CustomerResource extends AdminPanelResource
{
    public static function model(): string
    {
        return Customer::class;
    }

    public static function routeName(): string
    {
        return 'backoffice.customers';
    }

    public static function title(): string
    {
        return 'Customers';
    }

    public static function singularLabel(): string
    {
        return 'Customer';
    }

    public static function navigation(): array
    {
        return [
            'label' => 'Customers',
            'icon' => 'group-line',
            'group' => 'Workspace',
            'groupSort' => 10,
            'sort' => 20,
        ];
    }

    public static function query(): Builder
    {
        return Customer::query();
    }

    public static function columns(): array
    {
        return [
            [
                'name' => 'name',
                'label' => 'Name',
                'searchable' => true,
                'sortable' => true,
                'link' => 'show',
            ],
        ];
    }

    public static function fields(): array
    {
        return [
            [
                'name' => 'name',
                'label' => 'Name',
                'required' => true,
                'rules' => ['required', 'string', 'max:100'],
            ],
        ];
    }
}
```

注册：

```php
$panel->resource('customers', CustomerResource::class);
```

只开放部分操作：

```php
$panel->resource(
    'customers',
    CustomerResource::class,
    only: ['index', 'show', 'edit', 'update'],
);
```

排除操作：

```php
$panel->resource(
    'admin-users',
    AdminUserResource::class,
    except: ['destroy'],
);
```

Resource 的 `routeName()` 必须以当前 Panel 的 `route_name` 开头。

默认 CRUD 页面来自 `parse/admin-panel`：

```text
crud/index
crud/form
crud/show
```

业务 Resource 通常不需要创建自己的 CRUD 包装页面或 Layout。

生成 Resource：

```bash
php artisan make:admin-resource Customer --panel=backoffice
```

命令会通过 Model 的数据库连接和表名读取字段，并自动生成列表 `columns()`、
表单 `fields()` 及基础验证规则。可以用 `--model` 指定 Model，并用
`--namespace` 指定 Resource 命名空间（支持相对于应用根命名空间或完整命名空间）：

```bash
php artisan make:admin-resource Customer \
    --model=App\\Models\\Customer \
    --namespace=MerchantAdmin\\Resources \
    --panel=backoffice
```

命令参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--model` | 根据 Resource 名推断 | 代表该 Resource 的 Eloquent Model |
| `--namespace` | `{App 根命名空间}\\Admin\\Resources` | Resource 命名空间 |
| `--panel` | `admin` | 已注册的 Panel ID |
| `--uri` | Model 复数 kebab-case | Resource URI |
| `--group` | `Resources` | 导航分组 |
| `--icon` | `table-line` | 导航图标 |
| `--force` | — | 覆盖已存在的 Resource 文件 |

生成器会从 Model 的数据库表结构读取字段，因此目标表必须已存在；命令只生成 Resource，不会自动写入
`routes/admin.php`。生成完成后，按命令输出的示例手动调用 `$panel->resource(...)` 注册。

`--panel` 默认值是 `admin`。只有目标 Panel 的 ID 正好是 `admin` 时才可以省略；其他 Panel（包括只有一个
`backoffice` Panel 的应用）都必须显式传入 `--panel`。

## 多租户 Resource

多租户隔离应放在 Resource 的 `query()` 中：

```php
public static function query(): Builder
{
    return Customer::query()->currentMerchant();
}
```

CRUD Controller 的列表和 `resolveRecord()` 都使用该查询，因此其他租户的
record 会返回 404。

必须为每个多租户 Resource 编写跨租户测试，至少覆盖：

- show
- edit
- update
- delete

不能只在前端隐藏菜单或按钮。

## 共享 Inertia Props

实现 `SharesPanelProps`：

```php
<?php

namespace Acme\Backoffice\Support;

use Illuminate\Http\Request;
use Parse\AdminPanel\Contracts\SharesPanelProps;
use Parse\AdminPanel\Panel;

final class BackofficePanelProps implements SharesPanelProps
{
    public function share(Request $request, Panel $panel): array
    {
        return [
            'organization' => [
                'name' => 'Acme',
            ],
            'panel' => [
                'brand' => [
                    'name' => 'Acme Backoffice',
                    'logo' => null,
                ],
            ],
        ];
    }
}
```

配置：

```php
'shared_props' => BackofficePanelProps::class,
```

`panel.brand` 会被通用 `AdminPanelLayout` 使用：

```php
'panel' => [
    'brand' => [
        'name' => $merchant->name,
        'logo' => $merchant->logo,
    ],
],
```

通用 middleware 始终补充：

```text
panel.id
auth.user
navigation
```

不要把密码、密钥、付款信息或其他敏感字段放入 Inertia props。

## 多语言与主题

Panel 通过 `SetAdminPanelLocale` 按 Panel 独立保存语言 Cookie（有效期一年）：

```text
admin_panel_{panel_id}_locale
```

前端共享的 `i18n` props 包含 `locale`、`fallbackLocale`、`supportedLocales`、`messages` 和 `switchUrl`。
语言切换通过 `POST {route_name}.locale.update` 完成；不在支持列表中的 Cookie 值会回退到 Panel 默认语言。

Laravel 的翻译目录名称可以使用 `zh_CN`，但浏览器 `Intl` API 只接受 BCP 47 标签。需要把语言值传给
`Intl.DateTimeFormat`、`toLocaleString` 等 API 时，请先将 `zh_CN` 规范化为 `zh-CN`，不要直接把下划线格式传入。

Panel 的 `theme` 会作为 `panel.theme` 共享给前端，并由 `AdminPanelLayout` 写入 CSS 变量。配置值只能是非空、
不包含 `;` 或 `{}` 的 CSS 值；不要把用户输入直接写入主题配置。

```php
'theme' => [
    'primary' => '#1D4ED8',
    'primary_foreground' => '#FFFFFF',
],
```

`brand` 的 `name` 必填，`logo` 和 `favicon` 可为空。业务共享 props 中的 `panel.brand` 会覆盖同名默认值，
适合动态展示当前租户品牌。

## 业务中间件

Panel 可以追加业务中间件：

```php
'middleware' => [
    'web',
    ResolveMerchant::class,
],
```

例如 Merchant Panel 使用中间件根据当前 `merchant_admin` 用户设置：

```text
current_merchant
request.attributes.current_merchant
```

中间件不得把请求级状态保存在 singleton 或 static 属性中。应用使用
Laravel Octane 时，请求结束前必须清理租户上下文。

## 自定义登录页

配置：

```php
'login_component' => 'backoffice/login',
```

登录页会收到：

```ts
type LoginProps = {
    loginAction: string;
};
```

提交示例：

```tsx
export default function Login({ loginAction }: LoginProps) {
    return (
        <AuthLoginPage
            action={{ method: 'post', url: loginAction }}
            title="Sign in"
        />
    );
}
```

不配置时使用 Admin Panel 内置的 `login` 页面。

## 前端页面目录

Admin Panel 前端入口会自动发现：

```text
resources/js/admin/**/*.tsx
packages/*/*/resources/js/admin-pages/**/*.tsx
```

应用目录中的 `components` 子目录不会注册为 Inertia 页面。

建议业务包按 Panel ID 建立命名空间：

```text
resources/js/admin-pages/backoffice/dashboard.tsx
resources/js/admin-pages/backoffice/login.tsx
resources/js/admin-pages/backoffice/reports.tsx
```

对应：

```php
Inertia::render('backoffice/dashboard');
Inertia::render('backoffice/login');
Inertia::render('backoffice/reports');
```

component 名称必须唯一。重复名称会在前端解析时抛出异常。

业务页面可以复用：

```tsx
import { AdminPanelLayout } from '@admin-panel/layouts/admin-panel-layout';
```

宿主应用需要在 Vite 和 TypeScript 中配置 `@admin-panel` alias；或者使用项目
现有的相对路径约定。

## 导航

Dashboard 自动位于 `Workspace` 分组。

Resource 导航由 `navigation()` 生成。普通页面导航由 `page()` 的
`navigation` 参数生成。

支持字段：

| 字段 | 说明 |
| --- | --- |
| `label` | 菜单名称 |
| `icon` | Remix Icon 名称，例如 `group-line` |
| `group` | 分组名称 |
| `groupSort` | 分组排序 |
| `sort` | 分组内排序 |

Resource 不应显示在导航时：

```php
public static function navigation(): ?array
{
    return null;
}
```

Resource 菜单还会调用 `authorize('viewAny', $user)`。

## 路由名称

假设：

```php
'route_name' => 'backoffice',
```

则通用路由为：

```text
backoffice.login
backoffice.login.store
backoffice.dashboard
backoffice.logout
```

Resource：

```text
backoffice.customers
backoffice.customers.create
backoffice.customers.store
backoffice.customers.show
backoffice.customers.edit
backoffice.customers.update
backoffice.customers.destroy
```

在 PHP 中可以使用：

```php
$panel->route('dashboard'); // backoffice.dashboard
```

## 当前项目示例

Admin：

```text
config/upp/admin.php
routes/admin-panel.php
```

Merchant：

```text
config/upp/merchant-admin.php
routes/merchant-admin.php
resources/js/admin/merchant
```

Admin 展示了：

- 独立用户模型和状态限制
- 根路径 Dashboard
- CRUD Resource

Merchant 展示了：

- 独立 guard/provider
- 自定义登录页
- `/dashboard` Dashboard
- 租户上下文中间件
- 动态品牌
- 多租户 Resource
- CRUD 之外的业务路由

## 验证

修改 Panel 后至少执行：

```bash
vendor/bin/pint --dirty --format agent
php artisan test --compact
php artisan route:cache
php artisan route:clear
pnpm types:check
pnpm build
```

重点确认：

- 不同 Panel 的 domain、prefix 和 route name 不冲突
- guard/provider/model 没有串用
- 登录与退出重定向正确
- Dashboard 和普通页面 component 可解析
- Resource 菜单和授权正确
- 多租户记录不能跨租户读取或修改
- 路由可以缓存
