pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    choice(name: 'TARGET_PLATFORM', choices: ['aws', 'mainland-china'], description: 'Deployment plane. AWS covers overseas ASP; mainland-china covers IKP/Alicloud/Tencent COS.')
    choice(name: 'TARGET_ENV', choices: ['testing-ap-east-1', 'testing-ap-southeast-1', 'prod-ap-east-1', 'prod-ap-southeast-1', 'testing-cn', 'prod-cn'], description: 'Target environment.')
    choice(name: 'ACTION', choices: ['deploy', 'restart', 'site-switch', 'terraform-plan', 'terraform-apply', 'build-only', 'china-validate', 'china-plan', 'china-apply-runtime', 'china-publish-static'], description: 'Pipeline operation.')
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Image/static artifact tag. Empty uses git short SHA.')
    string(name: 'SERVICES', defaultValue: 'bff-java,ocdp-console,ucp-console,web-sdui', description: 'Comma-separated services for restart/deploy.')
    string(name: 'STATIC_BUCKET', defaultValue: '', description: 'Optional S3 bucket for static console/web bundles.')
    string(name: 'CLOUDFRONT_DISTRIBUTION_ID', defaultValue: '', description: 'Optional CloudFront distribution to invalidate after static deploy.')
    string(name: 'ROUTE53_HOSTED_ZONE_ID', defaultValue: '', description: 'Hosted zone for site switch.')
    string(name: 'SWITCH_RECORD_NAME', defaultValue: '', description: 'DNS record to switch, e.g. sdui.example.com.')
    string(name: 'SWITCH_PRIMARY_DNS', defaultValue: '', description: 'Primary target DNS name.')
    string(name: 'SWITCH_SECONDARY_DNS', defaultValue: '', description: 'Secondary target DNS name.')
    choice(name: 'SWITCH_TARGET', choices: ['primary', 'secondary'], description: 'Site switch target.')
    booleanParam(name: 'REQUIRE_PROD_APPROVAL', defaultValue: true, description: 'Require manual approval before production deploy/apply/switch.')
  }

  environment {
    AWS_DEFAULT_REGION = ''
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.RESOLVED_TAG = params.IMAGE_TAG?.trim()
          if (!env.RESOLVED_TAG) {
            env.RESOLVED_TAG = sh(script: 'git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S', returnStdout: true).trim()
          }
          currentBuild.displayName = "#${env.BUILD_NUMBER} ${params.TARGET_PLATFORM} ${params.ACTION} ${params.TARGET_ENV} ${env.RESOLVED_TAG}"
        }
      }
    }

    stage('Validate') {
      steps {
        sh 'node --check mock-bff/server.js'
        sh 'node --check mock-bff/sdui-v2.js'
        sh 'cd web-sdui && npm ci && npm run build'
        sh 'cd ocdp-console && npm ci && npm run build'
        sh 'cd ucp-console && npm ci && npm run build'
        sh 'cd android-sdui && ./gradlew :app:compileDebugKotlin'
      }
    }

    stage('Terraform Plan') {
      when {
        allOf {
          expression { params.TARGET_PLATFORM == 'aws' }
          anyOf { expression { params.ACTION == 'terraform-plan' }; expression { params.ACTION == 'terraform-apply' }; expression { params.ACTION == 'deploy' } }
        }
      }
      steps {
        sh "./scripts/aws-deploy.sh '${params.TARGET_ENV}' plan"
      }
    }

    stage('Approval') {
      when {
        allOf {
          expression { params.REQUIRE_PROD_APPROVAL }
          expression { params.TARGET_ENV.startsWith('prod-') || params.TARGET_ENV == 'prod-cn' }
          anyOf {
            expression { params.ACTION == 'deploy' }
            expression { params.ACTION == 'terraform-apply' }
            expression { params.ACTION == 'site-switch' }
            expression { params.ACTION == 'china-apply-runtime' }
            expression { params.ACTION == 'china-publish-static' }
          }
        }
      }
      steps {
        input message: "Approve ${params.ACTION} to ${params.TARGET_ENV}?", ok: 'Approve'
      }
    }

    stage('Terraform Apply') {
      when { allOf { expression { params.TARGET_PLATFORM == 'aws' }; expression { params.ACTION == 'terraform-apply' } } }
      steps {
        sh "./scripts/aws-deploy.sh '${params.TARGET_ENV}' apply"
      }
    }

    stage('Build and Push Images') {
      when { allOf { expression { params.TARGET_PLATFORM == 'aws' }; anyOf { expression { params.ACTION == 'deploy' }; expression { params.ACTION == 'build-only' } } } }
      steps {
        sh "./scripts/aws-build-push.sh '${params.TARGET_ENV}' '${env.RESOLVED_TAG}'"
      }
    }

    stage('Deploy Static Bundles') {
      when {
        allOf {
          expression { params.ACTION == 'deploy' }
          expression { params.TARGET_PLATFORM == 'aws' }
          expression { params.STATIC_BUCKET?.trim() }
        }
      }
      steps {
        sh """
          ./scripts/static-deploy.sh '${params.TARGET_ENV}' '${env.RESOLVED_TAG}' '${params.STATIC_BUCKET}' '${params.CLOUDFRONT_DISTRIBUTION_ID}'
        """
      }
    }

    stage('Kubernetes Rollout') {
      when { allOf { expression { params.TARGET_PLATFORM == 'aws' }; expression { params.ACTION == 'deploy' } } }
      steps {
        sh "./scripts/k8s-rollout.sh '${params.TARGET_ENV}' '${env.RESOLVED_TAG}' '${params.SERVICES}' deploy"
      }
    }

    stage('Restart Services') {
      when { allOf { expression { params.TARGET_PLATFORM == 'aws' }; expression { params.ACTION == 'restart' } } }
      steps {
        sh "./scripts/k8s-rollout.sh '${params.TARGET_ENV}' '${env.RESOLVED_TAG}' '${params.SERVICES}' restart"
      }
    }

    stage('Site Switch') {
      when { allOf { expression { params.TARGET_PLATFORM == 'aws' }; expression { params.ACTION == 'site-switch' } } }
      steps {
        sh """
          ./scripts/site-switch.sh '${params.TARGET_ENV}' '${params.ROUTE53_HOSTED_ZONE_ID}' '${params.SWITCH_RECORD_NAME}' '${params.SWITCH_PRIMARY_DNS}' '${params.SWITCH_SECONDARY_DNS}' '${params.SWITCH_TARGET}'
        """
      }
    }

    stage('Mainland China Validate') {
      when { allOf { expression { params.TARGET_PLATFORM == 'mainland-china' }; expression { params.ACTION == 'china-validate' } } }
      steps {
        sh "./scripts/china-deploy.sh '${params.TARGET_ENV}' validate"
      }
    }

    stage('Mainland China Plan') {
      when { allOf { expression { params.TARGET_PLATFORM == 'mainland-china' }; anyOf { expression { params.ACTION == 'china-plan' }; expression { params.ACTION == 'deploy' }; expression { params.ACTION == 'china-apply-runtime' }; expression { params.ACTION == 'china-publish-static' } } } }
      steps {
        sh "./scripts/china-deploy.sh '${params.TARGET_ENV}' plan"
      }
    }

    stage('Mainland China Apply IKP Runtime') {
      when { allOf { expression { params.TARGET_PLATFORM == 'mainland-china' }; anyOf { expression { params.ACTION == 'deploy' }; expression { params.ACTION == 'china-apply-runtime' } } } }
      steps {
        sh "./scripts/china-deploy.sh '${params.TARGET_ENV}' apply-runtime"
      }
    }

    stage('Mainland China Publish Tencent COS/CDN') {
      when { allOf { expression { params.TARGET_PLATFORM == 'mainland-china' }; anyOf { expression { params.ACTION == 'deploy' }; expression { params.ACTION == 'china-publish-static' } } } }
      steps {
        sh "./scripts/china-deploy.sh '${params.TARGET_ENV}' publish-static"
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'web-sdui/dist/**,ocdp-console/dist/**,ucp-console/dist/**', allowEmptyArchive: true
    }
  }
}
