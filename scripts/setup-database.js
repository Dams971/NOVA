const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Configuration de la base de données Nova...\n');

  try {
    // Configuration de connexion (sans spécifier de base de données)
    const connectionConfig = {
      host: 'localhost',
      port: 3306,
      user: 'root', // Utilisez votre utilisateur MySQL root
      // password: 'your_root_password', // Décommentez et ajoutez votre mot de passe root si nécessaire
    };

    console.log('📡 Connexion à MySQL...');
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connecté à MySQL avec succès!\n');

    // Lire et exécuter le script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, '..', 'setup-database.sql'), 'utf8');
    const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);

    console.log('📝 Exécution du script de création de base de données...');
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Base de données créée avec succès!\n');

    // Tester la connexion avec le nouvel utilisateur
    console.log('🔐 Test de connexion avec le nouvel utilisateur...');
    const testConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'nova_user',
      password: 'nova_password_2024',
      database: 'nova_db'
    });

    await testConnection.execute('SELECT 1 as test');
    console.log('✅ Connexion utilisateur testée avec succès!\n');

    await testConnection.end();
    await connection.end();

    console.log('🎉 Configuration de la base de données terminée!');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Exécutez: npm run migrate');
    console.log('   2. Démarrez le serveur: npm run dev');
    console.log('   3. Accédez à: http://localhost:3000/manager/cabinet-1\n');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Solutions possibles:');
      console.log('   1. Vérifiez que MySQL est démarré');
      console.log('   2. Modifiez le mot de passe root dans le script');
      console.log('   3. Ou exécutez manuellement le fichier setup-database.sql dans MySQL Workbench');
    }
    
    process.exit(1);
  }
}

setupDatabase();
