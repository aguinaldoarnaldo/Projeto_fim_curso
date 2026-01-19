"""
Django settings for core project.
"""

from pathlib import Path
from datetime import timedelta
import os
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-+s=4r9(6fm8@7j8=n0wqm4z-c0gam_1+m+eg-+%pd5ef1-p&$)'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    # Django Unfold - DEVE estar antes de django.contrib.admin
    'unfold',
    'unfold.contrib.filters',
    'unfold.contrib.forms',
    'unfold.contrib.import_export',
    
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    
    # Local apps
    'apis.apps.ApisConfig',
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3573',
    'http://localhost:5173',
]

CORS_ALLOW_CREDENTIALS = True

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'gestao_escolar',
        'USER': 'postgres',
        'PASSWORD': 'Aguinaldo',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'Africa/Luanda'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATICFILES_DIRS=[
    os.path.join(BASE_DIR,STATIC_URL)
]
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apis.permissions.authentication.SchoolJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# =============================================================================
# DJANGO UNFOLD CONFIGURATION - Tema Verde Sofisticado
# =============================================================================

UNFOLD = {
 
    "SITE_TITLE": "Sistema de Gestão de Declarações",
    "SITE_HEADER": "Gestão de Declarações",
    "SITE_URL": "localhost:5173",
    "SITE_SYMBOL": "school", # Símbolo do Material Symbols
    "SHOW_HISTORY": True, # Mostra botão de histórico
    "SHOW_VIEW_ON_SITE": True, # Mostra botão ver no site
    #"THEME": "dark", # Tema padrão dark
    
    "SITE_ICON": {
        "light": lambda request: static("image/favicon.ico"),
        "dark": lambda request: static("image/favicon.ico"),
    },
    
    # SIDEBAR
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "navigation": [
            {
                "title": "Dashboard",
                "separator": True,
                "items": [
                    {
                        "title": "Dashboards",
                        "icon": "dashboard",
                        "link": lambda request: "/dashboard-academico/",
                    },
                    {
                        "title": "Visão Geral",
                        "icon": "dashboard",
                        "link": lambda request: "/admin",
                    },
                ],
            },
            {
                "title": "Usuários",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Funcionários",
                        "icon": "badge",
                        "link": lambda request: "/admin/apis/funcionario/",
                    },
                    {
                        "title": "Alunos",
                        "icon": "school",
                        "link": lambda request: "/admin/apis/aluno/",
                    },
                    {
                        "title": "Encarregados",
                        "icon": "supervisor_account",
                        "link": lambda request: "/admin/apis/encarregado/",
                    },
                    {
                        "title": "Cargos",
                        "icon": "work",
                        "link": lambda request: "/admin/apis/cargo/",
                    },
                ],
            },
            {
                "title": "Académico",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Cursos",
                        "icon": "menu_book",
                        "link": lambda request: "/admin/apis/curso/",
                    },
                    {
                        "title": "Turmas",
                        "icon": "groups",
                        "link": lambda request: "/admin/apis/turma/",
                    },
                    {
                        "title": "Disciplinas",
                        "icon": "subject",
                        "link": lambda request: "/admin/apis/disciplina/",
                    },
                    {
                        "title": "Salas",
                        "icon": "meeting_room",
                        "link": lambda request: "/admin/apis/sala/",
                    },
                ],
            },
            {
                "title": "Avaliações",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Notas",
                        "icon": "grade",
                        "link": lambda request: "/admin/apis/nota/",
                    },
                    {
                        "title": "Faltas",
                        "icon": "event_busy",
                        "link": lambda request: "/admin/apis/faltaaluno/",
                    },
                ],
            },
            {
                "title": "Documentos",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Solicitações",
                        "icon": "description",
                        "link": lambda request: "/admin/apis/solicitacaodocumento/",
                    },
                    {
                        "title": "Documentos Gerados",
                        "icon": "insert_drive_file",
                        "link": lambda request: "/admin/apis/documento/",
                    },
                ],
            },
            {
                "title": "Financeiro",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Faturas",
                        "icon": "receipt",
                        "link": lambda request: "/admin/apis/fatura/",
                    },
                    {
                        "title": "Pagamentos",
                        "icon": "payment",
                        "link": lambda request: "/admin/apis/pagamento/",
                    },
                ],
            },
            {
                "title": "Biblioteca",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Livros",
                        "icon": "book",
                        "link": lambda request: "/admin/apis/livro/",
                    },
                    {
                        "title": "Categorias",
                        "icon": "category",
                        "link": lambda request: "/admin/apis/categoria/",
                    },
                ],
            },
        ],
    },
    
    # TEMA - Emerald Forest Professional
    "COLORS": {
        "primary": {
            "50": "236 253 245",
            "100": "209 250 229",
            "200": "167 243 208",
            "300": "110 231 183",
            "400": "52 211 153",
            "500": "16 185 129",   # Emerald Base
            "600": "5 150 105",
            "700": "4 120 87",
            "800": "6 95 70",
            "900": "6 78 59",
            "950": "2 44 34",
        },
        "font": {
            "subtle": "156 163 175", # cinza suave para textos secundários
        }
    },
    
    "STYLES": [
        lambda request: static("css/admin_custom.css"),
    ],
    
    # TABS
    "TABS": [
        {
            "models": [
                "apis.funcionario",
                "apis.aluno",
                "apis.encarregado",
            ],
            "items": [
                {
                    "title": "Funcionários",
                    "link": lambda request: "/admin/apis/funcionario/",
                },
                {
                    "title": "Alunos",
                    "link": lambda request: "/admin/apis/aluno/",
                },
                {
                    "title": "Encarregados",
                    "link": lambda request: "/admin/apis/encarregado/",
                },
            ],
        },
    ],

    # EXTENSIONS
    "EXTENSIONS": {
        "modeltranslation": {
            "flags": {
                "en": "🇬🇧",
                "pt": "🇦🇴",
            },
        },
    },
    
    # THEME
    #"THEME": "auto",  # light, dark, auto
    # DASHBOARD
    "DASHBOARD_CALLBACK": "apis.dashboard.dashboard_callback",
   
}

# Import static helper
from django.templatetags.static import static
