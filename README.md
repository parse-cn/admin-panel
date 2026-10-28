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
pnpm build
```

安装命令会：

- 发布 `config/admin-panel.php`
- 发布本包迁移和 Spatie 权限迁移，然后执行 `migrate`（包含宿主项目全部待执行迁移）
- 迁移成功后，按已启用权限的 Panel guard 初始化默认 `admin` 角色及角色管理权限
- 创建 `routes/admin-panel.php`
- 补充前端依赖
- 创建 `resources/js/admin-panel.tsx` 并注册为 Admin Panel Vite 入口
- 注册 Inertia、React 和 Tailwind Vite 插件
- 注册 `@admin-panel` 的 TypeScript alias 与 source 路径
- 调用 `wayfinder:generate --with-form` 生成 Wayfinder 类型

如果安装器报告 `package.json`、Vite 配置或 TypeScript 配置无法自动修改，按警告手动补齐后再执行
`pnpm install` 和 `pnpm build`。安装命令不会创建或修改业务 Panel 配置。

安装器会把 Admin Panel 使用的前端包及其 Vite 运行时依赖（例如
`@base-ui/utils`、`@tanstack/table-core`）声明为项目直接依赖。Vite 使用
`preserveSymlinks: false`，重复安装时也会将已有的 `true` 配置更新为 `false`。

安装命令默认发布本包迁移和 Spatie 权限迁移，保留已有文件。
Spatie 使用包内默认配置，不会默认生成 `config/permission.php`。
发布完成后自动执行 `migrate`，包含宿主项目全部待执行迁移。生产环境保留 Laravel 的确认提示；
非交互部署可使用 `php artisan admin-panel:install --force`，该选项仅用于迁移确认，不会强制覆盖发布文件。
安装会创建默认角色及权限，但不会修改用户模型或将角色分配给具体用户；按输出提示完成用户模型配置和管理员分配。
相同 guard 只初始化一次，重复安装保留已有角色及额外权限，不创建重复数据。
重复运行不会强制覆盖配置和已发布迁移。安装、迁移或 Wayfinder 生成失败时返回非零退出码。

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
        'entry' => 'resources/js/admin-panel.tsx',
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

### columns() 参数

`columns()` 定义列表页的每一列。除以下列出的键外，其他自定义键会原样透传给前端。

| 键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 必填 | 字段名，取自 record 属性（支持点号取嵌套值） |
| `label` | string | 必填 | 表头文案，前端会走 i18n 翻译 |
| `type` | string | `'text'` | 渲染类型，见下表 |
| `searchable` | bool \| string[] | `false` | 是否参与搜索；传 `string[]` 时指定实际搜索的列（如关联字段） |
| `sortable` | bool | `false` | 是否可排序 |
| `defaultSort` | `'asc'` \| `'desc'` | — | 默认排序方向（目前前端尚未消费，保留键） |
| `filterable` | bool | 自动 | 有 `options` 或配置 `filter` 时自动为 `true` |
| `filter` | array | — | 覆盖筛选器定义：`['type' => 'select'\|'text'\|'date'\|'number', 'operators' => [...]]` |
| `options` | array | — | 值 => `{label, variant, icon, dot, pulse, className}` 映射，驱动 badge 渲染与筛选下拉 |
| `link` | `'show'` | — | 设置后单元格标题链接到详情页 |
| `detailOnly` | bool | `false` | 只在详情页显示，列表接口不返回该列 |
| `hidden` | bool | `false` | 不渲染该列 |
| `visible` | bool | `true` | 列表默认是否展示该列，用户可在列设置中调整 |
| `copyable` | bool | `false` | 显示为可点击复制的等宽文本 |
| `truncate` | bool | `false` | 限宽截断并显示 title |
| `truncateMiddle` | bool | `false` | 中间省略（适合长 ID，超过 14 字符时 `前7…后7`） |

例如，默认隐藏邮箱列，允许用户在列设置中开启：

```php
['name' => 'email', 'label' => '邮箱', 'type' => 'text', 'visible' => false],
```

列类型：

| type | 说明 | 专用参数 |
| --- | --- | --- |
| `text` | 纯文本（默认） | — |
| `badge` | 状态徽章，浅色胶囊，值经 `options` 映射 | `options` 中每项可配 `variant`（`default`/`primary`/`secondary`/`info`/`success`/`warning`/`destructive`/`focus`/`invert`）、`icon`（Remix 图标名）、`dot`（圆点）、`pulse`（圆点呼吸闪烁）、`className` |
| `boolean` | ✓/– 布尔展示，文案取 i18n 的 boolean 选项 | — |
| `datetime` | 按 Panel 时区与语言格式化 | — |
| `decimal` | 金额展示（字符串精度，不转 Number） | — |
| `signed-decimal` | 带符号金额，正负着色 | `signedColorReference`：指定判断内部流动的参照列 |
| `identity` | 头像/图标 + 标题 + 副标题的实体列 | `subtitle`：副标题列名；`avatar`：头像 URL 列名；`icon`：无头像时显示的 Remix 图标名 |
| `json` | JSON 树形只读展示 | — |

示例：

```php
public static function columns(): array
{
    return [
        [
            'name' => 'name',
            'label' => 'Name',
            'type' => 'identity',
            'icon' => 'user-line',
            'subtitle' => 'email',
            'searchable' => true,
            'sortable' => true,
            'link' => 'show',
            'truncate' => true,
        ],
        [
            'name' => 'status',
            'label' => 'Status',
            'type' => 'badge',
            'options' => [
                'active' => ['label' => 'Active', 'variant' => 'success', 'icon' => 'check-line'],
                'pending' => ['label' => 'Pending', 'variant' => 'warning', 'dot' => true],
                'processing' => ['label' => 'Processing', 'variant' => 'info', 'dot' => true, 'pulse' => true],
                'disabled' => ['label' => 'Disabled', 'variant' => 'destructive'],
            ],
            'filterable' => true,
        ],
    ];
}
```

### fields() 参数

`fields()` 定义创建/编辑表单。数组项可以是单个字段，也可以是分组：

```php
// 分组：columns 为 2 | 3 | 4 列栅格
[
    'columns' => 2,
    'fields' => [
        ['name' => 'first_name', 'label' => 'First name'],
        ['name' => 'last_name', 'label' => 'Last name'],
    ],
]
```

单个字段支持的键（`rules` / `itemRules` 只用于服务端验证，不会传给前端）：

| 键 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 必填 | 字段名 |
| `label` | string | 必填 | 表单标签，走 i18n 翻译 |
| `type` | string | `'text'` | 控件类型，见下表 |
| `required` | bool | `false` | 前端必填标记（星号与校验提示）；服务端必填需在 `rules` 里显式写 `'required'` |
| `requiredOnCreate` | bool | `false` | 前端仅在创建表单标记必填；服务端需在 `rules`（可用闭包按创建/更新区分）里体现 |
| `writeOnly` | bool | `false` | 只提交不回显（如密码）；该字段不会出现在 record values |
| `placeholder` | string | — | 占位文案 |
| `options` | array | — | `select` 的选项：`[{label, value, variant, icon, dot, pulse, className}]`，下拉项支持状态视觉 |
| `preview` | string | — | 预览值来源字段名（编辑时回显用） |
| `uploadUrl` | string | — | 覆盖图片上传地址，默认使用 Panel 的 `image` 上传用途 |
| `credentialOptions` | array | — | 按父字段值分组的 `select` 子选项：`{父值 => [{key, optional}]}` |
| `rules` | array \| string \| Closure | — | Laravel 验证规则，应用于 `{name}`；支持闭包 `fn ($record)` 按记录区分 |
| `itemRules` | array \| Closure | — | `ip-list` 的逐项规则，自动转换为 `{name}.*`；支持闭包 `fn ($record)` |

字段类型：

| type | 说明 |
| --- | --- |
| `text` | 单行文本（默认） |
| `email` | 邮箱输入 |
| `password` | 密码输入（建议配合 `writeOnly`） |
| `textarea` | 多行文本 |
| `select` | 下拉选择，需 `options` |
| `boolean` | 开关 |
| `image` / `image-url` | 图片上传 / 图片 URL 输入 |
| `ip-list` | IP 标签输入，以 `string[]` 提交，配合 `itemRules` |
| `key-value` | 键值对列表 |
| `json` | JSON 树形编辑器（json-edit-react），提交值为 JSON 字符串 |

示例：

```php
public static function fields(): array
{
    return [
        [
            'name' => 'email',
            'label' => 'Email',
            'type' => 'email',
            'required' => true,
            'rules' => ['required', 'email', 'max:255'],
        ],
        [
            'name' => 'password',
            'label' => 'Password',
            'type' => 'password',
            'writeOnly' => true,
            'requiredOnCreate' => true,
            'rules' => ['nullable', 'string', 'min:8'],
        ],
        [
            'name' => 'status',
            'label' => 'Status',
            'type' => 'select',
            'options' => [
                ['label' => 'Active', 'value' => 'active', 'variant' => 'success'],
                ['label' => 'Disabled', 'value' => 'disabled', 'variant' => 'destructive'],
            ],
            'rules' => ['required', 'in:active,disabled'],
        ],
    ];
}
```

IP 白名单可使用专用的标签输入字段。它以 `string[]` 提交；`itemRules`
会被转换为 Laravel 的 `allowed_ips.*` 验证规则：

```php
[
    'name' => 'allowed_ips',
    'label' => 'Allowed IP addresses',
    'type' => 'ip-list',
    'placeholder' => 'Enter an IP address',
    'rules' => ['nullable', 'array'],
    'itemRules' => ['ip', 'distinct'],
]
```

该控件支持回车、逗号或粘贴的逗号/换行列表创建标签，并将
`allowed_ips.0` 之类的验证错误显示在对应标签上。

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
`routes/admin-panel.php`。生成完成后，按命令输出的示例手动调用 `$panel->resource(...)` 注册。

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

## 验证器二次验证（TOTP）

二次验证默认关闭，使用 Google Authenticator 或其他标准 TOTP 验证器，无需申请 Google 服务。

先在宿主项目发布迁移并执行：

```bash
php artisan vendor:publish --tag=admin-panel-migrations
php artisan migrate
```

在需要启用功能的 Panel 配置中添加：

```php
'auth' => [
    'guard' => 'admin_panel',
    'provider' => 'users',
    'model' => User::class,
    'two_factor' => ['enabled' => true],
],
```

如需强制所有用户使用 2FA，将配置设为：

```php
'two_factor' => ['enabled' => true, 'required' => true],
```

`required` 默认是 `false`。开启后，未绑定用户只能访问安全设置进行绑定或退出登录，
其他后台页面和接口均被拦截。完成绑定后可继续使用后台，后续登录仍需二次验证。
强制模式不允许关闭 2FA，但仍可重新生成恢复码。`required: true` 必须同时设置 `enabled: true`。

用户模型需要实现 Laravel `Authenticatable` 契约，且 Panel 的个人设置页面必须启用。
无需修改用户表或添加 Trait。已有宿主项目需要重新运行 `php artisan admin-panel:install`
以同步前端依赖声明，再使用宿主已有的 Node 环境安装依赖和构建资源。
React 使用 `qrcode.react` 本地渲染二维码，PHP 使用 `pragmarx/google2fa` 验证动态码。

用户可在个人设置的安全页面验证当前密码后绑定验证器。绑定操作有 5 分钟有效期，
扫码后必须输入正确的六位验证码才会启用。恢复码仅在绑定或重新生成时展示一次，
每个恢复码只能使用一次，数据库只保存哈希；重新生成会立即废弃旧恢复码。
解绑及重新生成恢复码均要求当前密码和有效动态码或恢复码。解绑后退出当前会话。

密钥加密保存在独立的 `admin_panel_totp_secrets` 表，通过用户模型类和用户标识定位，
支持整数及 UUID 标识。同一用户跨 Panel 共用绑定，但二次验证会话标记按 Panel 隔离。
请保持服务器时钟同步并妥善保存 `APP_KEY`；动态码允许前后一个 30 秒周期的时间偏差，
成功验证后禁止重复使用相同时间步。

已绑定用户先验证密码，再进入有 5 分钟有效期的验证码挑战，完成后才正式登录。
“记住我”恢复的会话及共享 guard 的已有会话仍需通过当前 Panel 的二次验证检查。
登录验证码和管理接口均限流，关闭功能配置不会删除已有绑定。
验证器与恢复码全部丢失时，由宿主通过受控运维流程删除该用户的绑定记录，再重新绑定。

## 角色与权限

角色权限底层使用 `spatie/laravel-permission`，沿用其默认表结构、模型配置和缓存机制。
后台仅提供角色管理；权限在角色编辑表单中分组展示，不提供独立权限列表或权限 CRUD。

### 安装与启用

在宿主 Laravel 项目运行 `php artisan admin-panel:install` 会发布 Admin Panel 配置、本包迁移和 Spatie 权限迁移，并执行数据库迁移；也可以单独发布 Spatie 权限迁移，再执行迁移：

```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider" --tag="permission-migrations"
php artisan migrate
```

需要自定义 Spatie 模型、表名或缓存配置时，再按需发布配置：

```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider" --tag="permission-config"
```

用户模型使用 Spatie trait，并明确支持哪些 guard：

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;

    public function guardName(): array
    {
        return ['web', 'admin_panel'];
    }
}
```

权限控制默认开启，包括未显式设置 `authorization.enabled` 的 Panel。需要关闭时配置：

```php
'authorization' => ['enabled' => false],
```

显式关闭时，原有 Resource 授权行为保持不变。开启后，默认的
`AdminPanelResource::authorize()` 使用当前用户的 Laravel Gate/Policy，未授权返回 403。
已有 Resource 自定义的 `authorize()` 方法仍优先生效，需要业务自行接入。
用户模型的 `HasRoles` 要求在处理 Panel HTTP 请求时检查，避免阻断首次安装、迁移及其他 Artisan 命令。

角色与权限以 Panel 的 `auth.guard` 为范围：相同 guard 共享角色权限，不同 guard 分开管理。
管理界面不允许客户端切换 guard。当前集成不支持 Spatie teams，启用 teams 时会明确报错，
不会修改宿主的 teams 配置。

安装命令已为每个启用权限的 guard 创建默认 `admin` 角色和以下六项权限。
为首个管理员分配角色时执行（用户必须已存在）：

```bash
php artisan admin-panel:permissions-init --panel=admin_panel --user=1 --role=admin
```

初始化及角色分配命令共用以下管理权限定义；角色分配命令也会补齐缺失权限，重复运行不会删除已有权限或角色关联：

```text
roles.viewAny
roles.view
roles.create
roles.update
roles.delete
users.assignRoles
```

角色管理入口为当前 Panel 下的 `/roles`，菜单需要 `roles.viewAny`。
角色名称在当前 guard 内唯一，创建与更新会在 CRUD 事务中同步权限。
有用户关联的角色禁止删除。具有角色创建或编辑权限的管理员可分配当前 guard 的全部权限，
因此这些能力只应授予权限管理员。这里没有额外的超级管理员绕过机制。

### 业务权限与 Policy

权限可以通过下文的 Resource 生成命令、宿主 Seeder 或 Spatie API 维护。
使用模型配置解析类，兼容宿主自定义 Permission 模型：

```php
$permissionModel = config('permission.models.permission');
$permissionModel::findOrCreate('posts.update', 'admin_panel');
```

业务 Policy 负责权限和记录限制，例如：

```php
public function update(User $user, Post $post): bool
{
    $panel = app(\Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager::class)
        ->current(request());

    return \Parse\AdminPanel\Authorization\PanelPermissions::allows($user, 'posts.update', $panel)
        && $post->author_id === $user->getKey();
}
```

对应的 `viewAny`、`view`、`create`、`delete` 等方法也由业务 Policy 定义，遵循 Laravel
自动发现规则或通过 `Gate::policy()` 注册。不要将原始的 `update` 等通用 Policy ability
作为全局 Spatie 权限授予，以免 Gate 的权限检查提前放行业务 Policy。
列表数据范围仍需在 Resource 查询中设置；操作权限不会自动过滤数据。

普通 Page 可以声明权限，菜单与路由使用相同检查：

```php
$panel->page(
    'reports',
    'reports',
    ReportController::class,
    navigation: ['label' => '报表', 'icon' => 'bar-chart-line'],
    permission: 'reports.view',
);
```

### 接入宿主用户管理

包不创建用户管理页面。宿主用户 Resource 继承 `AdminPanelUserResource`，
并在表单中指定角色字段的位置即可：

```php
use Parse\AdminPanel\Resources\AdminPanelUserResource;

final class UserResource extends AdminPanelUserResource
{
    public static function fields(): array
    {
        return [
            // 原有姓名、邮箱、密码等业务字段……
            ...static::roleFields(),
        ];
    }
}
```

基类自动处理 `role_ids` 校验、已有角色回填、新建和更新时的角色关联同步，
复用现有 `AssignUserRoles`，不将角色数组写入用户表。角色字段只在 Panel 开启权限控制、
且操作者具有 `users.assignRoles` 时显示；无权限时禁止提交该字段。
角色选项及关联操作均限制在当前 Panel guard，其他 guard 的角色保留。
未提交 `role_ids` 表示保持不变，提交空数组表示清空当前 guard 的角色。

用户模型需与当前 Panel 配置的用户模型匹配，并按前文配置 Spatie `HasRoles` 和支持的 guard。
业务仍需定义用户 CRUD 的 Policy 和数据范围；用户编辑权限不等于角色分配权限。
密码处理、字段布局及业务校验继续由宿主负责。

覆盖 `rules()`、`record()`、`createRecord()` 或 `updateRecord()` 时，必须调用对应
`parent::...()` 才能保留角色集成。业务字段转换优先使用已有的 `prepareForCreate()`、
`prepareForUpdate()` 或 `prepareForPersistence()` 扩展点。
内置 CRUD 在事务中执行用户保存和角色分配；自定义保存流程需自行提供相同的事务边界。
普通 `AdminPanelResource` 的行为保持不变。

自定义用户管理表单仍可直接调用 `AssignUserRoles`：

```php
use Parse\AdminPanel\Authorization\Actions\AssignUserRoles;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

$panel = app(PanelManager::class)->current(request());
$actor = request()->user($panel->guard);
$roles = app(AssignUserRoles::class);

$field = $roles->field($panel, $actor);
$selected = $roles->selected($panel, $actor, $user);
$roles->handle($panel, $actor, $user, $validated['role_ids']);
```

这些底层入口同样检查角色分配权限和 guard，宿主需先对目标用户授权，并将用户信息保存
与角色分配置于同一事务。

### 更新

Spatie 配置与迁移由宿主维护；本包不会重复发布权限建表迁移，也不会自动覆盖
`permission.php`。管理界面保留在包内，宿主通过模型配置和 Laravel Policy 扩展，
更新时无需复制角色管理源码。

角色表单和详情会翻译常见权限操作，分组优先复用对应 Resource 的名称；未知权限保留原 key。
详情标签悬停可查看原始 key。宿主可通过 Laravel 语言覆盖文件中的
`authorization.permission_labels`（按权限 key 嵌套）、`authorization.actions` 和
`authorization.permission_groups` 自定义展示，不改变权限名称及数据库关联。

### 角色导航配置

在对应 Panel 配置的 `navigation.roles` 中调整内置角色管理入口：

```php
'navigation' => [
    'roles' => [
        'label' => '角色管理',
        'icon' => 'shield-user-line',
        'group' => '权限管理',
        'groupSort' => 30,
        'section' => '系统设置',
        'sectionSort' => 20,
        'sort' => 10,
        'hidden' => false,
    ],
],
```

支持 `badge` 和 `activeRoutes`；label、group、section、badge 可使用翻译 key。
省略字段沿用原默认值，各 Panel 独立配置。`hidden` 只隐藏导航，不关闭角色路由；
角色入口始终需要当前 guard 的 `roles.viewAny` 权限。

### 权限清单与部署同步

开发环境生成权限清单和 Policy，提交 Git；生产环境只同步已发布清单：

```bash
# 开发
php artisan admin-panel:generate --panel=merchant
# 部署，在数据库迁移后执行
php artisan admin-panel:permissions-sync --panel=merchant
```

默认清单为 `config/admin-panel-permissions.php`，直接返回权限 key 列表，使用短数组语法且不包含数字索引或 Panel 分组。
多个 Panel 必须分别配置不同的 `permissions_file`，否则命令会拒绝执行，避免覆盖。
模块项目可以在对应 Panel 配置中指定独立清单文件，并声明自定义权限：

```php
'authorization' => [
    'enabled' => true,
    'permissions_file' => 'app/Modules/MerchantAdmin/Infrastructure/config/admin-panel-permissions.php',
    'permissions' => [
        'orders.refund',
    ],
],
```

路径相对于宿主项目根目录。独立文件只返回当前 Panel 的权限 key 列表：

```php
return [
    'customers.view',
    'customers.viewAny',
    'orders.refund',
    // 以及其他生成的权限
];
```

生成器合并 Resource、Widget、自定义权限和内置的六项角色管理权限，去重并稳定排序。
清单不保存数据库 ID、label 或 group；自定义权限请维护在 Panel 配置中，不手改生成文件。
完整生成会替换当前 Panel 的独立清单；
`--resource` 局部生成只合并新增权限，移除旧权限需要执行完整生成。
`--only=policies` 不读取或修改权限清单，`--only=permissions` 只生成清单。

同步命令直接读取清单文件，不扫描资源；按 `name + guard_name` 补齐，保留已有 ID 和角色关联，
重置权限缓存。同步完成后逐项输出 `[Created]` 或 `[Exists]`，并汇总数量；写入失败输出 `[Failed]`、回滚本次事务并返回非零退出码。
`--dry-run` 输出 `[Will create]` 或 `[Exists]`，不写入数据。清单缺失时拒绝同步，数据库中的多余权限仅报告，不自动删除。
多个 Panel 共用 guard 时，多余项也可能来自其他 Panel。
权限改名需显式数据迁移，避免丢失原角色关联。
清单修改后，使用 Laravel 配置缓存的项目应在部署时重新执行 `config:cache`。
原生成命令的 `--assign-role` 选项移至 `admin-panel:permissions-sync`。

### 生成 Resource 权限与 Policy

先在 `routes/admin-panel.php` 注册 Resource，再运行：

```bash
php artisan admin-panel:generate --panel=admin_panel
php artisan admin-panel:generate --panel=admin_panel --resource=PostResource
php artisan admin-panel:generate --panel=admin_panel --resource='App\Admin\Resources\PostResource'
php artisan admin-panel:generate --panel=admin_panel --only=permissions
php artisan admin-panel:generate --panel=admin_panel --only=policies
php artisan admin-panel:generate --panel=admin_panel --dry-run
```

`--resource` 支持逗号分隔多个资源；短类名有歧义时需使用完整类名。
默认读取指定 Panel 已注册的 CRUD Resource 和通过 `$panel->widget()` 注册的嵌入式 Widget，
不扫描未注册目录，也不生成普通 Page 或自定义路由的权限。
`--resource` 同样支持 Widget 的类名；同一个类同时注册为 Resource 和 Widget 时，
会合并两种入口的操作，并且可以直接通过类名选择。
内置角色管理使用安装时初始化的六项权限，不另行生成 RolePolicy。

默认权限前缀取 Model 名称的复数 snake_case，例如 `Post` 对应 `posts`，
`BlogCategory` 对应 `blog_categories`。需要稳定命名时在 Resource 显式声明：

```php
public static function permissionPrefix(): string
{
    return 'posts';
}
```

权限名称为 `posts.viewAny`、`posts.view`、`posts.create`、`posts.update`、`posts.delete`，
生成到权限清单，不直接写入数据库；部署时通过同步命令按当前 Panel 的 guard 入库。
`only` / `except` 路由配置及 `canCreate()`、`canUpdate()`、`canDelete()` 决定本次生成哪些权限。
创建或更新任一对应路由存在时生成相应权限；开放批量路由且允许删除时也生成 `delete` 权限，
批量操作继续逐条执行授权。同一 Model 的多个 Resource 合并权限。

同步时默认不把权限分配给角色。如需追加给当前 guard 的已有角色，显式指定：

```bash
php artisan admin-panel:permissions-sync --panel=admin_panel --assign-role=admin
```

该操作保留角色原有权限；角色不存在或属于其他 guard 时拒绝执行。
两个命令均支持 `--dry-run`。生成命令不访问权限数据库，可在迁移前运行；同步命令需要已执行权限迁移。

Policy 使用宿主应用命名空间和 `app/Policies` 目录，保留 `Models` 下的嵌套结构：

```text
App\Models\Post       → App\Policies\PostPolicy
App\Models\Blog\Post  → App\Policies\Blog\PostPolicy
```

模板包含 `viewAny`、`view`、`create`、`update`、`delete` 五个方法，便于同一模型跨 Panel 复用；
即使某个 Panel 未生成对应操作权限，也不会因此被放行。方法通过已有 `PanelPermissions`
使用当前请求中已解析 Panel 的 guard 检查权限，在没有 Panel 上下文或关闭授权时返回 false。
模型的记录归属等业务规则需在生成后补充。队列和其他非 Panel 场景需要业务显式处理授权上下文。

未配置自定义位置时，宿主 `Models` 目录之外的模型仍生成在 `app/Policies` 下对应完整模型命名空间的目录中。
模块化项目可以在宿主 `config/admin-panel.php` 的顶层配置 Policy 位置映射：

```php
'authorization' => [
    'policy_locations' => [
        'App\\Modules\\*\\Domain\\Models' => [
            'namespace' => 'App\\Modules\\*\\Infrastructure\\Policies',
            'path' => 'app/Modules/*/Infrastructure/Policies',
        ],
    ],
],
```

例如，`App\Modules\Customer\Domain\Models\Customer` 生成到
`app/Modules/Customer/Infrastructure/Policies/CustomerPolicy.php`，类名为
`App\Modules\Customer\Infrastructure\Policies\CustomerPolicy`。
模型命名空间中 `Models` 后的嵌套结构也会保留。

映射按声明顺序匹配第一条规则，特殊模块的规则应放在通用规则之前。
模型命名空间前缀最多包含一个独立的 `*` 段，代表一个模块名；
Policy 命名空间和目录中的 `*` 替换为该模块名，`path` 相对于宿主项目根目录。
此配置对所有 Panel 共用，同一模型不会因为 guard 不同生成多份 Policy。

对于自定义位置，生成命令会输出具体的 `Gate::policy()` 注册提示，
需将其加入宿主对应模块的 ServiceProvider。例如：

```php
Gate::policy(
    \App\Modules\Customer\Domain\Models\Customer::class,
    \App\Modules\Customer\Infrastructure\Policies\CustomerPolicy::class,
);
```

已注册的 Policy 优先保留，修改映射不会自动移动或覆盖它。
未显式注册的已有文件也不会被覆盖；映射产生同名类或相同输出文件时，会在写入前报告冲突。
如果宿主自定义了 Laravel 的 Policy 发现规则，也应确认注册方式。

已存在或已注册的 Policy 始终保留，不自动覆盖或合并业务代码。
Resource 覆盖了 `authorize()` 时会提示检查其是否调用 Policy。
同一 Model 使用不同权限前缀，或同一 guard 中不同 Model 共用权限前缀时，
命令会在写入前报告冲突。生成后修改了前缀、增加了操作或调整了已有 Policy 时，
需同步检查 Policy 中的权限名称；旧权限不会自动删除。

安装命令只初始化基础角色管理权限，业务 Resource 的生成由此命令单独执行。
