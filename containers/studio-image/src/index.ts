import { seedContainer, startStudioApi } from '@quatrain/studio-api'
import { StudioStorage } from '@quatrain/studio'
import { Storage } from '@quatrain/storage'
import { Api } from '@quatrain/api'
import { LocalStorageAdapter } from '@quatrain/storage-local'

async function bootstrap() {
   try {
      // 1. Seed the container if necessary
      await seedContainer()

      // 2. Start the API core
      await startStudioApi()

      // 3. Mount adapters based on DB configuration
      const storages = await StudioStorage.query().execute()
      for (const storageModel of storages.items) {
         if (storageModel.provider === 'local') {
            const options = storageModel.options || {}
            const adapter = new LocalStorageAdapter(options)
            Storage.addStorage(adapter, storageModel.name, storageModel.isDefault)
            Api.info(`Mounted local storage: ${storageModel.name}`)
         }
         // Add S3 or other storage providers here later
      }

      Api.info('Studio Container successfully booted and ready.')
   } catch (e: any) {
      Api.error(`Bootstrap failed: ${e.message}`)
      process.exit(1)
   }
}

bootstrap()
