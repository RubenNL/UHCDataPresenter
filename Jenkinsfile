pipeline {
	agent none
	stages {
		stage('build') {
			agent { label 'maven && !node' }
			steps {
				sh 'apt-get update -q && apt-get install -qy zip'
				sh './gradlew build'
				sh 'cd overlay && zip -r overlay.zip *'
				archiveArtifacts artifacts: 'build/libs/uhc-data-presenter-*.jar, overlay/overlay.zip', excludes: 'build/libs/uhc-data-presenter-*-*.jar', fingerprint: true
			}
		}
	}
}
